import type { Pool } from "pg";

export async function initDbSchema(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        preferred_language TEXT DEFAULT 'ar',
        preferred_currency TEXT DEFAULT 'SAR',
        email_verified BOOLEAN NOT NULL DEFAULT false,
        verification_code TEXT DEFAULT '',
        verification_expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);

    // Ensure all columns exist in users in case of existing older table
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'ar';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'SAR';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code TEXT DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
      ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    `);

    // 2. currencies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS currencies (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        symbol TEXT NOT NULL,
        rate_to_usd REAL NOT NULL DEFAULT 1,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_default BOOLEAN NOT NULL DEFAULT false,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 3. categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        icon TEXT DEFAULT '📦',
        image TEXT DEFAULT '',
        description_ar TEXT DEFAULT '',
        description_en TEXT DEFAULT '',
        is_active BOOLEAN NOT NULL DEFAULT true,
        deleted_at TIMESTAMP
      );
    `);

    // 4. products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        sku TEXT NOT NULL UNIQUE,
        price REAL NOT NULL,
        cost REAL NOT NULL DEFAULT 0,
        quantity INTEGER NOT NULL DEFAULT 0,
        min_quantity INTEGER NOT NULL DEFAULT 0,
        category_id INTEGER,
        description_ar TEXT DEFAULT '',
        description_en TEXT DEFAULT '',
        image TEXT DEFAULT '',
        is_active BOOLEAN NOT NULL DEFAULT true,
        deleted_at TIMESTAMP
      );
    `);

    // 5. product_translations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_translations (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        language TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 6. customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT DEFAULT '',
        address TEXT DEFAULT '',
        city TEXT DEFAULT '',
        country TEXT DEFAULT 'SA',
        total_orders INTEGER NOT NULL DEFAULT 0,
        total_spent REAL NOT NULL DEFAULT 0,
        loyalty_points INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);

    // 7. vendors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
        store_name TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT DEFAULT '',
        address TEXT DEFAULT '',
        commission_rate REAL NOT NULL DEFAULT 10,
        balance REAL NOT NULL DEFAULT 0,
        is_approved BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);

    // 8. affiliates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS affiliates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT DEFAULT '',
        code TEXT NOT NULL UNIQUE,
        commission_rate REAL NOT NULL DEFAULT 5,
        balance REAL NOT NULL DEFAULT 0,
        total_earned REAL NOT NULL DEFAULT 0,
        total_clicks INTEGER NOT NULL DEFAULT 0,
        total_conversions INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);

    // 9. affiliate_conversions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS affiliate_conversions (
        id SERIAL PRIMARY KEY,
        affiliate_id INTEGER NOT NULL,
        order_id INTEGER,
        order_number TEXT,
        order_total REAL NOT NULL DEFAULT 0,
        commission_amount REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 10. dropship_products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dropship_products (
        id SERIAL PRIMARY KEY,
        product_id INTEGER,
        platform TEXT NOT NULL,
        source_id TEXT NOT NULL,
        source_url TEXT NOT NULL DEFAULT '',
        source_price REAL NOT NULL DEFAULT 0,
        source_currency TEXT NOT NULL DEFAULT 'USD',
        our_price REAL NOT NULL DEFAULT 0,
        supplier_name TEXT DEFAULT '',
        platform_commission_rate REAL NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 11. platform_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 12. payment_gateways table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_gateways (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        provider TEXT NOT NULL,
        config JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_default BOOLEAN NOT NULL DEFAULT false,
        supported_currencies JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 13. orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number TEXT NOT NULL UNIQUE,
        customer_id INTEGER,
        customer_name TEXT NOT NULL,
        customer_email TEXT DEFAULT '',
        customer_phone TEXT DEFAULT '',
        shipping_address TEXT DEFAULT '',
        shipping_city TEXT DEFAULT '',
        shipping_country TEXT DEFAULT 'SA',
        payment_method TEXT NOT NULL DEFAULT 'cod',
        payment_status TEXT NOT NULL DEFAULT 'pending',
        payment_gateway TEXT DEFAULT '',
        payment_transaction_id TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        currency TEXT NOT NULL DEFAULT 'SAR',
        subtotal REAL NOT NULL DEFAULT 0,
        discount REAL NOT NULL DEFAULT 0,
        tax REAL NOT NULL DEFAULT 0,
        shipping REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        affiliate_code TEXT DEFAULT '',
        fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled',
        fulfillment_platform TEXT DEFAULT '',
        supplier_tracking TEXT DEFAULT '',
        platform_order_id TEXT DEFAULT '',
        order_date TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 14. supplier_payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS supplier_payments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        order_number TEXT NOT NULL,
        platform TEXT NOT NULL,
        supplier_cost REAL NOT NULL DEFAULT 0,
        supplier_currency TEXT NOT NULL DEFAULT 'USD',
        customer_paid REAL NOT NULL DEFAULT 0,
        customer_currency TEXT NOT NULL DEFAULT 'SAR',
        admin_profit REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        paid_at TIMESTAMP,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 15. vendor_stripe_accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendor_stripe_accounts (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER NOT NULL UNIQUE,
        stripe_account_id TEXT NOT NULL,
        stripe_account_status TEXT NOT NULL DEFAULT 'pending',
        charges_enabled BOOLEAN NOT NULL DEFAULT false,
        payouts_enabled BOOLEAN NOT NULL DEFAULT false,
        onboarding_url TEXT DEFAULT '',
        dashboard_url TEXT DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 16. shipping_carriers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS shipping_carriers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        tracking_url_template TEXT DEFAULT '',
        is_active BOOLEAN NOT NULL DEFAULT true
      );
    `);

    // 17. shipments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        carrier_id INTEGER,
        tracking_number TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        estimated_delivery TIMESTAMP,
        actual_delivery TIMESTAMP,
        cost REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'SAR',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await client.query("COMMIT");
    console.log("Database schema initialized successfully (17 tables verified)");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error initializing database schema:", error);
    throw error;
  } finally {
    client.release();
  }
}
