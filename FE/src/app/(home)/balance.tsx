import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SavingsGoalCard from "@/src/Components/SavingGoalCard";
import TransactionItem from "@/src/Components/TransactionItem";
import { SafeAreaView } from "react-native-safe-area-context";
import mainStyles from "@/src/styles/mainStyle";
import GreetingHeader from "@/src/Components/HomeHeader";
import { Transaction } from "@/models/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getTotalExpense,
  getTotalIncome,
  getTransactionsByUserId,
} from "@/QuanLyTaiChinh-backend/transactionServices";

const BalanceScreen = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [totalIncome, setTotalIncome] = useState<string>("0");
  const [totalExpense, setTotalExpense] = useState<string>("0");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<"income" | "expense">("expense");

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

          const trans: Transaction[] = await getTransactionsByUserId(userId);
          setTransactions(trans);
        } catch (error) {
          console.error("Lỗi khi fetch:", error);
        }
      }
    };
    fetchData();
  }, [userId]);

  const filteredTransactions = transactions.filter(
    (item) => item.type === filterType
  );

  return (
    <SafeAreaView style={mainStyles.container}>
      <SafeAreaView style={[mainStyles.topSheet, { padding: 0 }]}>
        <GreetingHeader />
        <View style={{paddingHorizontal: 20}}> 
            <SavingsGoalCard />
        </View>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            onPress={() => setFilterType("income")}
            style={[
              styles.toggleButton,
              filterType === "income" && styles.toggleActive,
            ]}
          >
            <MaterialCommunityIcons
              name="arrow-top-right-bold-box"
              size={16}
              color={filterType === "income" ? "#fff" : "green"}
            />
            <Text
              style={[
                styles.toggleText,
                filterType === "income" && styles.toggleTextActive,
              ]}
            >
              Thu: {totalIncome}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterType("expense")}
            style={[
              styles.toggleButton,
              filterType === "expense" && styles.toggleActive,
            ]}
          >
            <MaterialCommunityIcons
              name="arrow-bottom-right-bold-box"
              size={16}
              color={filterType === "expense" ? "#fff" : "red"}
            />
            <Text
              style={[
                styles.toggleText,
                filterType === "expense" && styles.toggleTextActive,
              ]}
            >
              Chi: {totalExpense}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={mainStyles.bottomeSheet}>
        <View style={{ flexDirection: "row" }}>
          <Text style={{ flex: 1 }}>Giao dịch gần đây</Text>
        </View>

        <FlatList
          data={filteredTransactions}
          style={{ paddingBottom: 50 }}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {
            const date = item.date.toDate();
            const formatted =
              date.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              }) +
              " - " +
              date.toLocaleDateString("vi-VN");

            return (
              <TransactionItem
                categoryName={item.categoryId}
                description={item.decription}
                time={formatted}
                amount={item.amount}
                type={item.type}
              />
            );
          }}
          contentContainerStyle={{ paddingTop: 10 }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    marginBottom: 10,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#F1FFF3",
  },
  toggleActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  toggleText: {
    marginLeft: 6,
    color: "#333",
  },
  toggleTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default BalanceScreen;
