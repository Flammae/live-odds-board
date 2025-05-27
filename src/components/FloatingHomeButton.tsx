import styles from "./FloatingHomeButton.module.css";

export function FloatingHomeButton() {
	return (
		<a
			href="/"
			className={`${styles.floatingButton}`}
			aria-label="Go to home page"
		>
			⬆️
		</a>
	);
}
