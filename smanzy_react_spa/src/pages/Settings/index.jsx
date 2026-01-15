import { useState } from "react";
import { Panel, Button, Alert } from "@/components";
import styles from "./index.module.scss";
import api from "@/services/api";

export default function Settings() {
    const [syncedData, setSyncedData] = useState(null);
    const [alert, setAlert] = useState(null);

    // sync video database
    const syncVideoDatabase = () => {
        api.post("/videos/sync").then((res) => {
            setSyncedData(res.data);
            setAlert({
                variant: 'success',
                message: `${res.data.fetched} - ${res.data.message}`
            });
        });
    };

    return (
        <div className={styles.container}>
            <Panel title="Settings">
                <div>
                    <h2>Site Settings</h2>
                    <p>Manage site settings here</p>
                    <hr className={styles.lineBreak} />
                    <ul className={styles.list}>
                        <li className={styles.listItem}>
                            <h3>Sync video database</h3>
                            <Button variant="primary" onClick={syncVideoDatabase}>Sync</Button>
                        </li>
                        {alert && (
                            <Alert
                                variant={alert.variant}
                                dismissible
                                onClose={() => setAlert(null)}
                            >
                                {alert.message}
                            </Alert>
                        )}
                    </ul>
                </div>
            </Panel>

        </div>
    );
}
