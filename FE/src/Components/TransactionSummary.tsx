import React, { useState, useEffect, use } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
} from "react-native";
import TransactionItem from "./TransactionItem"; // Reuse từ phần trước
import { User, Transaction } from "@/models/types"; // Giả sử bạn đã định nghĩa User trong models/types.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserById } from "../../QuanLyTaiChinh-backend/userServices";
import { getTransactionsByDate,getAllTransactions, getTransactionsByYear, getTransactionsByMonth, getTransactionsByUserId
    ,getTodayTransactions, getCurrentMonthTransactions,
} from '@/QuanLyTaiChinh-backend/transactionServices'; // Giả sử bạn đã định nghĩa hàm này
const filters = ["Ngày", "Tuần", "Tháng"];

const allData = {
    Ngày: [
        { title: "Mua Sắm", time: "10:00 - 3/6", amount: 100000 },
        { title: "Nơi Ở", time: "8:00 - 3/6", amount: 3250000 },
    ],
    Tuần: [
        { title: "Thu Nhập", time: "10:00 - 30/5", amount: 5000000 },
        { title: "Mua Sắm", time: "16:00 - 1/6", amount: 450000 },
    ],
    Tháng: [
        { title: "Thu Nhập", time: "18:27 - 30/4", amount: 7500000 },
        { title: "Mua Sắm", time: "17:00 - 20/5", amount: 500000 },
        { title: "Nơi Ở", time: "8:30 - 13/5", amount: 3250000 },
    ],
};

const TransactionScreen = () => {
    //const router = useRouter();
    //const { transactions, loading } = useCategory();
    const [selectedFilter, setSelectedFilter] = useState("Tháng");
    const [userId, setUserId] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<Transaction[] | null>([]); // Thay any bằng kiểu dữ liệu thực tế của bạn
    useEffect(() => {
        const fetchUserId = async () => {
            const id = await AsyncStorage.getItem("userId");
            console.log("Fetched userId:", id); // Thêm dòng này
            setUserId(id);
        };
        fetchUserId();
    }, []);
    useEffect(() => {
    const fetchTransactions = async () => {
        if (userId) {
            try {
                let trans: Transaction[] = [];
                //trans = await getAllTransactions();
                const currentDate = new Date();
                
                switch (selectedFilter) {
                    case "Ngày":
                        // Lấy transactions hôm nay
                        trans = await getTransactionsByDate(userId, currentDate);
                        break;
                        
                    case "Tháng":
                        // Lấy transactions tháng hiện tại
                        const currentMonth = currentDate.getMonth() + 1 ; // +1 vì getMonth() trả về 0-11
                        const currentYear = currentDate.getFullYear();
                        trans = await getTransactionsByMonth(userId, currentMonth, currentYear);
                        break;
                        
                    case "Năm":
                        // Lấy transactions năm hiện tại
                        const year = currentDate.getFullYear();
                        trans = await getTransactionsByYear(userId, year);
                        break;
                        
                    case "Tất cả":
                    default:
                        // Lấy tất cả transactions của user
                        trans = await getTransactionsByUserId(userId);
                        break;
                }
                trans.sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());
                
                console.log(`Fetched ${selectedFilter} transactions:`, trans);
                setTransactions(trans); 
            } catch (error) {
                console.error('Error fetching transactions:', error);
                setTransactions([]);
            }
        }
    };
    fetchTransactions();
}, [userId, selectedFilter]); 
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.filterRow}>
                {filters.map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        onPress={() => setSelectedFilter(filter)}
                        style={[
                            styles.filterButton,
                            selectedFilter === filter &&
                                styles.filterButtonActive,
                        ]}>
                        <Text
                            style={[
                                styles.filterText,
                                selectedFilter === filter &&
                                    styles.filterTextActive,
                            ]}>
                            {filter}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList scrollEnabled={true}
                data={transactions}
                style={{paddingBottom: 50}}
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
                            categoryName={item.categoryId}     // icon theo danh mục
                            description={item.decription}        // mô tả hiển thị
                            time={formatted}
                            amount={item.amount}
                            type={item.type}
                            />
                    );
                }}
                contentContainerStyle={{ paddingTop: 10 }}
            />
        </SafeAreaView>
    );
};

export default TransactionScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        padding: 16,
    },
    filterRow: {
        flexDirection: "row",
        backgroundColor: "#D6F0FF",
        borderRadius: 25,
        padding: 4,
        justifyContent: "space-around",
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    filterButtonActive: {
        backgroundColor: "#6DBDFF",
    },
    filterText: {
        color: "#000",
        fontWeight: "500",
    },
    filterTextActive: {
        color: "white",
        fontWeight: "bold",
    },
});
