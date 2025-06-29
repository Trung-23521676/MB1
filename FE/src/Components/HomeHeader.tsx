import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Account } from "@/models/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAccountByUserId } from "../../QuanLyTaiChinh-backend/accountServices";
import { getTotalExpense, getTotalIncome } from "../../QuanLyTaiChinh-backend/transactionServices";
import { useRefresh } from '@/src/context/refreshContext';

const GreetingHeader = () => {
  const { refreshKey } = useRefresh();
  const [userId, setUserId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account | null>(null);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [totalIncome, setTotalIncome] = useState<number>(0);

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      setUserId(id);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchAccountAndTotals = async () => {
      if (userId) {
        try {
          const accountData = await getAccountByUserId(userId);
          if (accountData && accountData.length > 0) {
            setAccounts(accountData[0]);
          } else {
            setAccounts(null);
          }

          const expense = await getTotalExpense(userId);
          const income = await getTotalIncome(userId);
          setTotalExpense(expense);
          setTotalIncome(income)
        } catch (error) {
          console.error("Lỗi khi fetch account hoặc tổng thu/chi:", error);
          setAccounts(null);
          setTotalExpense(0);
          setTotalIncome(0);
        }
      }
    };
    fetchAccountAndTotals();
  }, [userId, refreshKey]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.summaryRow}>
        <View style={styles.block}>
          <View style={styles.labelRow}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={16}
              color="#fff"
            />
            <Text style={styles.label}>Số dư tài khoản</Text>
          </View>
          <Text style={styles.amount}>
            {accounts?.balance?.toLocaleString("vi-VN") ?? "0"}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.block}>
          <View style={styles.labelRow}>
            <Ionicons name="trending-down-outline" size={16} color="#fff" />
            <Text style={styles.label}>Tổng chi</Text>
          </View>
          <Text style={styles.amount}>
            {totalExpense.toLocaleString("vi-VN")}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default GreetingHeader;

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  block: {
    alignItems: "center",
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 14,
  },
  amount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  divider: {
    width: 1,
    backgroundColor: "#fff",
    height: "100%",
  },
});