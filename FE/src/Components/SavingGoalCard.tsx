import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { User } from "@/models/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    getTotalExpense,
    getTotalIncome,
} from "@/QuanLyTaiChinh-backend/transactionServices";
import { useRefresh } from '@/src/context/refreshContext';

const SavingsGoalCard = () => {
    const { refreshKey } = useRefresh();
    const [userId, setUserId] = useState<string | null>(null);
    const [totalIncome, setTotalIncome] = useState<string>("0");
    const [totalExpense, setTotalExpense] = useState<string>("0");

    useEffect(() => {
        const fetchUserId = async () => {
            const id = await AsyncStorage.getItem("userId");
            setUserId(id);
        };
        fetchUserId();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (userId) {
                try {
                    const income = await getTotalIncome(userId);
                    const expense = await getTotalExpense(userId);
                    setTotalIncome(income.toString());
                    setTotalExpense(expense.toString());
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            }
        };
        fetchData();
    }, [userId, refreshKey]);

    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                <View style={styles.circle}>
                    <Ionicons name="cash-outline" size={24} color="white" />
                </View>
                <Text style={styles.goalText}>Lịch sử{"\n"}thu chi</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.rightSection}>
                <View style={styles.row}>
                    <Text style={styles.label}>Thu nhập tháng này</Text>
                    <Text style={styles.amount}>{Number(totalIncome).toLocaleString('vi-VN')}</Text>
                </View>
                <View style={styles.separator} />
                <View style={styles.row}>
                    <Text style={styles.label}>Chi tiêu tháng này</Text>
                    <Text style={styles.amount}>{Number(totalExpense).toLocaleString('vi-VN')}</Text>
                </View>
            </View>
        </View>
    );
};

export default SavingsGoalCard;

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        backgroundColor: "#6DBDFF",
        borderRadius: 40,
        padding: 16,
        alignItems: "center",
        justifyContent: "space-between",
    },
    leftSection: {
        alignItems: "center",
        justifyContent: "center",
    },
    circle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 5,
        borderColor: "black",
        backgroundColor: "#91D2FF",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    goalText: {
        textAlign: "center",
        color: "white",
        fontWeight: "bold",
    },
    divider: {
        width: 1,
        height: "80%",
        backgroundColor: "white",
        marginHorizontal: 10,
    },
    rightSection: {
        flex: 1,
        justifyContent: "center",
    },
    row: {
        marginBottom: 8,
    },
    label: {
        color: "white",
        fontSize: 14,
    },
    amount: {
        color: "#000",
        fontWeight: "bold",
        fontSize: 16,
    },
    separator: {
        height: 1,
        backgroundColor: "white",
        marginVertical: 4,
    },
});