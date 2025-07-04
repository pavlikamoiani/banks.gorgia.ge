import React from 'react';
import styles from '../assets/css/Pagination.module.css';

const getPageNumbers = (page, totalPages) => {
    const pages = [];
    if (totalPages <= 6) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (page <= 4) {
            pages.push(1, 2, 3, 4, 5, 'dots-right', totalPages);
        } else if (page >= totalPages - 3) {
            pages.push(1, 'dots-left', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, 'dots-left', page - 1, page, page + 1, 'dots-right', totalPages);
        }
    }
    return pages;
};

const Pagination = ({ total, page, pageSize, onChange }) => {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return null;

    const handlePrev = () => {
        if (page > 1) onChange(page - 1);
    };

    const handleNext = () => {
        if (page < totalPages) onChange(page + 1);
    };

    const pageNumbers = getPageNumbers(page, totalPages);

    return (
        <div className={styles.paginationContainer}>
            <button
                onClick={handlePrev}
                disabled={page === 1}
                className={styles.paginationBtn}
                aria-label="Previous"
            >
                &lt;
            </button>
            {pageNumbers.map((num, idx) => {
                if (num === 'dots-left' || num === 'dots-right') {
                    return (
                        <span
                            key={num + idx}
                            className={styles.paginationDots}
                        >...</span>
                    );
                }
                return (
                    <button
                        key={num + '-' + idx}
                        onClick={() => onChange(num)}
                        className={
                            num === page
                                ? `${styles.paginationBtn} ${styles.paginationBtnActive}`
                                : styles.paginationBtn
                        }
                        disabled={num === page}
                        aria-current={num === page ? "page" : undefined}
                    >
                        {num}
                    </button>
                );
            })}
            <button
                onClick={handleNext}
                disabled={page === totalPages}
                className={styles.paginationBtn}
                aria-label="Next"
            >
                &gt;
            </button>
        </div>
    );
};

export default Pagination;
