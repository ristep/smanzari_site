import { Panel } from "@/components";
import { useVersion } from "@/context/VersionContext";
import styles from "./index.module.scss";

import { VERSION_MAJOR, VERSION_MINOR, VERSION_PATCH, VERSION_PRE } from "@/version";

export default function About() {
  const { versionInfo, isLoading, error } = useVersion();

  return (
    <div className={styles.container}>
      <Panel title="About SmAnZaRy">
        <h2>About SmAnZaRy</h2>
        <div className={styles.content}>
          <p>
            SmAnZaRy is a YouTube channel that features ambient jazz piano,
            crackling fireplaces, snowy nights, and peaceful Christmas vibes.
            Perfect for focus, study, relaxation, and calm evenings.
            <br />
            <br />
          </p>
          <strong>The Tech Stack used to build this site:</strong>
          <ul className={styles.list}>
            <li>Backend: Go (Golang), Gin, GORM, PostgreSQL</li>
            <li>Frontend: React, Vite, SCSS Modules, TanStack Query</li>
            <li>Authentication: JWT (JSON Web Tokens)</li>
          </ul>
          <br />
          <div className={styles.versionInfo}>
            {isLoading ? (
              <p>Loading version info...</p>
            ) : error ? (
              <p className={styles.error}>Error loading version info</p>
            ) : (
              <div>
                <strong>Frontend Version</strong>
                <ul className={styles.list}>
                  <li>Version: {`${VERSION_MAJOR}.${VERSION_MINOR}.${VERSION_PATCH}`}</li>
                  <li>Build:   {VERSION_PRE}</li>
                </ul>
                <strong>API Version</strong>
                <ul className={styles.list}>
                  <li>Version: {versionInfo?.version}</li>
                  <li>Build:   {versionInfo?.build_time}</li>
                  {versionInfo?.git_commit && (
                    <li>Git Commit: {versionInfo.git_commit}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
