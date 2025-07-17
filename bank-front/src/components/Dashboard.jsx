import { useEffect, useState } from 'react';
import defaultInstance from '../api/defaultInstance';
import { useTranslation } from 'react-i18next';
import { Bar, Pie } from 'react-chartjs-2';
import styles from '../assets/css/dashboard.module.css';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const Dashboard = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const resp = await defaultInstance.get('/dashboard-stats');
                setStats(resp.data);
            } catch (e) {
                setStats(null);
            }
            setLoading(false);
        };
        fetchStats();
    }, []);

    if (loading) return <div className={styles.dashboardLoading}>{t('loading')}</div>;
    if (!stats) return <div className={styles.dashboardNoData}>{t('no_data_found')}</div>;

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.dashboardStatsRow}>
                <div className={styles.dashboardStatCard + ' ' + styles.todayCard}>
                    <div className={styles.dashboardStatLabel}>
                        <span role="img" aria-label="today" style={{ marginRight: 8 }}>📅</span>
                        {t('today_transactions')}
                    </div>
                    <div className={styles.dashboardStatValue}>{stats.todayTransactions}</div>
                </div>
                <div className={styles.dashboardStatCard + ' ' + styles.amountCard}>
                    <div className={styles.dashboardStatLabel}>
                        <span role="img" aria-label="money" style={{ marginRight: 8 }}>💰</span>
                        {t('total_amount')}
                    </div>
                    <div className={styles.dashboardStatValue}>{stats.totalAmount} ₾</div>
                </div>
                <div className={styles.dashboardTopContragents}>
                    <h4>{t('top_contragents')}</h4>
                    <ul>
                        {stats.topContragents.map(c => (
                            <li key={c.name}>
                                <span role="img" aria-label="star" style={{ marginRight: 4, color: '#ffa000' }}></span>
                                {c.name} — <b>{c.amount} ₾</b>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className={styles.dashboardChartsRow}>
                <div className={styles.dashboardChartCard}>
                    <h4>{t('transactions_by_day')}</h4>
                    <Bar
                        data={{
                            labels: stats.transactionsByDay.map(d => d.date),
                            datasets: [{
                                label: t('transactions'),
                                data: stats.transactionsByDay.map(d => d.count),
                                backgroundColor: '#1976d2',
                                borderRadius: 8,
                                barThickness: 32,
                            }]
                        }}
                        options={{
                            plugins: {
                                legend: { display: false }
                            },
                            scales: {
                                x: { grid: { display: false } },
                                y: { grid: { color: '#e3e3e3' } }
                            }
                        }}
                    />
                </div>
                <div className={styles.dashboardChartCardSmall}>
                    <Pie
                        data={{
                            labels: stats.transactionsByBank.map(b => b.bank),
                            datasets: [{
                                data: stats.transactionsByBank.map(b => b.count),
                                backgroundColor: ['#1976d2', '#43a047', '#ffa000', '#d32f2f']
                            }]
                        }}
                        options={{
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: { boxWidth: 20, boxHeight: 18, font: { size: 16 }, textAlign: 'center', color: '#000' }
                                }
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;