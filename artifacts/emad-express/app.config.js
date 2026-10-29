module.exports = ({ config }) => {
  // Dynamically resolve projectId from EAS Build worker environment if present,
  // preventing mismatch errors between different Expo dashboard project links.
  const projectId =
    process.env.EAS_BUILD_PROJECT_ID ||
    process.env.EAS_PROJECT_ID ||
    "fc146045-629d-4f02-8caa-45ab5419a618";

  return {
    ...config,
    extra: {
      ...config.extra,
      eas: {
        ...config.extra?.eas,
        projectId,
      },
    },
  };
};
