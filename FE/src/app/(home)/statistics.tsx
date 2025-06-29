import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import mainStyles from "@/src/styles/mainStyle";
import SavingGoalCard from "@/src/Components/SavingGoalCard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Transaction } from "@/models/types";
import { 
    getTransactionsByYear, 
    getTransactionsByMonth,
    getTransactionsByDate // Giả sử bạn có hàm này
} from "@/QuanLyTaiChinh-backend/transactionServices";
import { useRefresh } from "@/src/context/refreshContext";

const screenWidth = Dimensions.get("window").width;
const tabs = ["Ngày", "Tuần", "Tháng", "Năm"];

type Period = "Ngày" | "Tuần" | "Tháng" | "Năm";

const AnalyticsScreen = () => {
    const [selectedTab, setSelectedTab] = useState<Period>("Tháng");
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { refreshKey } = useRefresh();
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [
            { data: [], color: () => "#2F80ED" }, // Thu nhập (Xanh)
            { data: [], color: () => "#EB5757" }, // Chi tiêu (Đỏ)
        ],
        legend: ["Thu Nhập", "Chi Tiêu"],
    });

    useEffect(() => {
        const fetchUserId = async () => {
            const id = await AsyncStorage.getItem("userId");
            setUserId(id);
        };
        fetchUserId();
    }, []);

    useEffect(() => {
        if (!userId) return;

        const processDataForChart = (transactions: Transaction[], period: Period) => {
            let labels: string[] = [];
            let incomeData: number[] = [];
            let expenseData: number[] = [];
            const now = new Date();

            switch (period) {
                case "Ngày":
                    labels = ["6h", "12h", "18h", "24h"];
                    incomeData = [0, 0, 0, 0];
                    expenseData = [0, 0, 0, 0];
                    transactions.forEach(t => {
                        const hour = t.date.toDate().getHours();
                        let index = -1;
                        if (hour < 6) index = 0;
                        else if (hour < 12) index = 1;
                        else if (hour < 18) index = 2;
                        else index = 3;
                        if (t.type === 'income') incomeData[index] += t.amount;
                        else expenseData[index] += t.amount;
                    });
                    break;
                
                case "Tuần":
                    labels = Array.from({ length: 7 }, (_, i) => {
                        const d = new Date();
                        d.setDate(now.getDate() - (6 - i));
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                    });
                    incomeData = new Array(7).fill(0);
                    expenseData = new Array(7).fill(0);
                    transactions.forEach(t => {
                        const diffDays = Math.floor((now.setHours(23,59,59,999) - t.date.toDate().getTime()) / (1000 * 3600 * 24));
                        if (diffDays >= 0 && diffDays < 7) {
                            const index = 6 - diffDays;
                            if (t.type === 'income') incomeData[index] += t.amount;
                            else expenseData[index] += t.amount;
                        }
                    });
                    break;

                case "Tháng":
                    labels = ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"];
                    incomeData = [0, 0, 0, 0];
                    expenseData = [0, 0, 0, 0];
                    transactions.forEach(t => {
                        const dayOfMonth = t.date.toDate().getDate();
                        let index = -1;
                        if (dayOfMonth <= 7) index = 0;
                        else if (dayOfMonth <= 14) index = 1;
                        else if (dayOfMonth <= 21) index = 2;
                        else index = 3;
                        if (t.type === 'income') incomeData[index] += t.amount;
                        else expenseData[index] += t.amount;
                    });
                    break;

                case "Năm":
                    labels = ["Tháng 3", "Tháng 6", "Tháng 9", "Tháng 12"];
                    incomeData = [0, 0, 0, 0];
                    expenseData = [0, 0, 0, 0];
                    transactions.forEach(t => {
                        const month = t.date.toDate().getMonth(); // 0-11
                        let index = -1;
                        if (month < 3) index = 0; // Q1
                        else if (month < 6) index = 1; // Q2
                        else if (month < 9) index = 2; // Q3
                        else index = 3; // Q4
                        if (t.type === 'income') incomeData[index] += t.amount;
                        else expenseData[index] += t.amount;
                    });
                    break;
            }
            return { labels, datasets: [{ data: incomeData, color: () => "#2F80ED" }, { data: expenseData, color: () => "#EB5757" }], legend: ["Thu Nhập", "Chi Tiêu"] };
        };

        const fetchAndProcessData = async () => {
            setLoading(true);
            const now = new Date();
            let transactions: Transaction[] = [];

            try {
                switch (selectedTab) {
                    case "Ngày":
                        // Hàm getTransactionsByDate cần được tạo để lấy giao dịch trong 1 ngày cụ thể
                        transactions = await getTransactionsByDate?.(userId, now) || [];
                        break;
                    case "Tuần":
                        // Lấy dữ liệu 1 tháng để đảm bảo có đủ 7 ngày gần nhất
                        transactions = await getTransactionsByMonth(userId, now.getMonth() + 1, now.getFullYear());
                        break;
                    case "Tháng":
                        transactions = await getTransactionsByMonth(userId, now.getMonth() + 1, now.getFullYear());
                        break;
                    case "Năm":
                        transactions = await getTransactionsByYear(userId, now.getFullYear());
                        break;
                }
                
                const processedData = processDataForChart(transactions, selectedTab);
                setChartData(processedData);

            } catch (error) {
                console.error("Failed to fetch chart data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAndProcessData();
    }, [userId, selectedTab, refreshKey]);

    const chartConfig = {
        backgroundColor: "#EAF3FF",
        backgroundGradientFrom: "#EAF3FF",
        backgroundGradientTo: "#EAF3FF",
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
        propsForDots: { r: "4", strokeWidth: "2", stroke: "#fff" },
        formatYLabel: (yLabel: string) => {
          const value = Number(yLabel);
          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}tr`;
          if (value >= 1000) return `${Math.round(value / 1000)}k`;
          return yLabel;
        }
    };

    return (
        <SafeAreaView style={mainStyles.container}>
            <SafeAreaView style={[mainStyles.topSheet, { padding: 24 }]}>
                <SavingGoalCard />
            </SafeAreaView>

            <View style={mainStyles.bottomeSheet}>
                <View style={styles.tabs}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, selectedTab === tab && styles.tabSelected]}
                            onPress={() => setSelectedTab(tab as Period)}>
                            <Text style={selectedTab === tab ? styles.tabTextSelected : styles.tabText}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.chartContainer}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#4F91FF" style={{ height: 250 }} />
                    ) : (chartData.labels && chartData.labels.length > 0) ? (
                        <LineChart
                            data={chartData}
                            width={screenWidth - 32}
                            height={250}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chartStyle}
                            fromZero={true}
                        />
                    ) : (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>Không có dữ liệu để hiển thị</Text>
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

export default AnalyticsScreen;

const styles = StyleSheet.create({
    tabs: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginVertical: 12,
        marginHorizontal: 16,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: "#EAEFFF",
    },
    tabSelected: {
        backgroundColor: "#4F91FF",
    },
    tabText: {
        color: "#2F80ED",
        fontSize: 14
    },
    tabTextSelected: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 14,
    },
    chartContainer: {
        backgroundColor: "#EAF3FF",
        borderRadius: 24,
        padding: 16,
        marginTop: 10
    },
    chartStyle: {
        borderRadius: 20,
    },
    noDataContainer: {
        height: 250,
        justifyContent: 'center',
        alignItems: 'center'
    },
    noDataText: {
        color: '#666',
        fontSize: 16
    }
});