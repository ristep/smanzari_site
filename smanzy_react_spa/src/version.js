export const VERSION_MAJOR = 1;
export const VERSION_MINOR = 0;
export const VERSION_PATCH = 13;

export const formatVersion = (major, minor, patch) => {
    return `${major}.${minor}.${patch}`;
};

export const versionInfo = {
    version: formatVersion(VERSION_MAJOR, VERSION_MINOR, VERSION_PATCH),
};
