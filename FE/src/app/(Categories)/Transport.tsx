import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    FlatList,
} from "react-native";
import {
    useFonts,
    Montserrat_700Bold,
    Montserrat_400Regular,
} from "@expo-google-fonts/montserrat";
import { useRouter } from "expo-router";
import { Transaction, User } from "@/models/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    getTransactionsByCategory,
} from "@/QuanLyTaiChinh-backend/transactionServices";
import { getCategoryByName } from "@/QuanLyTaiChinh-backend/categoryServices";
import TransactionItem from "@/src/Components/TransactionItem";
import { SafeAreaView } from "react-native-safe-area-context";
import mainStyles from "@/src/styles/mainStyle";

export default function TransportScreen() {
    const [fontsLoaded] = useFonts({
        Montserrat_700Bold,
        Montserrat_400Regular,
    });

    const router = useRouter();

    const [selectedDate] = useState(new Date());
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const id = await AsyncStorage.getItem("userId");
                console.log("Fetched userId:", id);
                setUserId(id);
            } catch (error) {
                console.error("Error fetching userId:", error);
            }
        };
        fetchUserId();
    }, []);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!userId) return;

            try {
                setLoading(true);

                const cat = await getCategoryByName("Di Chuyển");
                if (!cat || cat.length === 0) {
                    setTransactions([]);
                    return;
                }

                const category = cat[0];
                const categoryId = category.id;

                if (!categoryId) {
                    setTransactions([]);
                    return;
                }

                const allTrans = await getTransactionsByCategory(categoryId);
                const userTrans = allTrans.filter(
                    (t) => t.userId === userId
                );
                
                setTransactions(userTrans);
                console.log("Fetched:", transactions);

            } catch (error) {
                console.error("Error fetching transactions:", error);
                setTransactions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [userId]);

    if (!fontsLoaded) return null;

    return (
        <SafeAreaView style={mainStyles.container}>
            <SafeAreaView style={[mainStyles.topSheet, { padding: 0 }]} />

            <View style={mainStyles.bottomeSheet}>
                <FlatList
                    data={transactions}
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
}
