import React from 'react';
import clsx from 'clsx';

import styles from './index.module.scss';

const Panel = ({ children, className = "" }) => {
    return (
        <div className={clsx(styles.panel, className)}>
            {children}
        </div>
    );
};

export default Panel;
