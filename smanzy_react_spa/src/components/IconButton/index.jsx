import styles from './index.module.scss';
import clsx from 'clsx';

const IconButton = ({ onClick, disabled, title, children, className = "" }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={clsx(styles.iconButton, className)}
        >
            {children}
        </button>
    );
};

export default IconButton;