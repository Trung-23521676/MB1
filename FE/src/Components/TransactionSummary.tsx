import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native"; // SỬA ĐỔI: Bỏ useFocusEffect không cần thiết
import TransactionItem from "./TransactionItem"; 
import { Transaction } from "@/models/types"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
    getTransactionsByMonth, 
    getTransactionsByUserId,
    getTransactionsByYear // Giả sử bạn có các hàm này
} from '@/QuanLyTaiChinh-backend/transactionServices'; 
import { deleteTransaction } from '@/QuanLyTaiChinh-backend/transactionServices';
import { useRefresh } from "@/src/context/refreshContext"; // THÊM: Import hook useRefresh

const TransactionScreen = () => {
    const navigation = useNavigation();
    const { refreshKey, triggerRefresh } = useRefresh(); // THÊM: Sử dụng hook useRefresh

    const [selectedFilter, setSelectedFilter] = useState("Tháng");
    const [userId, setUserId] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[] | null>([]); 
    const [loading, setLoading] = useState(false);

    // BỎ: Toàn bộ logic làm mới cục bộ
    // const [refreshKey, setRefreshKey] = useState(0);
    // const triggerRefresh = () => setRefreshKey(prev => prev + 1);
    // useFocusEffect(...);

    useEffect(() => {
        const fetchUserId = async () => {
            const id = await AsyncStorage.getItem("userId");
            setUserId(id);
        };
        fetchUserId();
    }, []);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (userId) {
                setLoading(true);
                try {
                    let trans: Transaction[] = [];
                    const currentDate = new Date();
                    
                    switch (selectedFilter) {
                        case "Ngày":
                            // Bạn cần một hàm để lấy giao dịch theo ngày
                            trans = await getTransactionsByUserId(userId);
                            trans = trans.filter(t => t.date.toDate().toDateString() === currentDate.toDateString());
                            break;
                        
                        case "Tuần":
                             const oneWeekAgo = new Date();
                             oneWeekAgo.setDate(currentDate.getDate() - 7);
                             trans = await getTransactionsByUserId(userId); // Tạm thời lấy tất cả rồi lọc
                             trans = trans.filter(t => t.date.toDate() >= oneWeekAgo);
                             break;
                            
                        case "Tháng":
                            const currentMonth = currentDate.getMonth() + 1;
                            const currentYear = currentDate.getFullYear();
                            trans = await getTransactionsByMonth(userId, currentMonth, currentYear);
                            break;
                            
                        case "Tất cả":
                        default:
                            trans = await getTransactionsByUserId(userId);
                            break;
                    }
                    trans.sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());
                    setTransactions(trans); 
                } catch (error) {
                    console.error('Error fetching transactions:', error);
                    setTransactions([]);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchTransactions();
    }, [userId, selectedFilter, refreshKey]); // SỬA ĐỔI: Phụ thuộc vào refreshKey từ context

    const handleDelete = async (id: string) => {
        Alert.alert(
            "Xác nhận Xóa",
            "Bạn có chắc chắn muốn xóa giao dịch này không?",
            [
                {
                    text: "Hủy",
                    style: "cancel"
                },
                {
                    text: "Đồng ý",
                    onPress: async () => {
                        try {
                            await deleteTransaction(id);
                            triggerRefresh(); // SỬA ĐỔI: Gọi triggerRefresh từ context
                        } catch (error) {
                            console.error('Delete failed:', error);
                            Alert.alert("Lỗi", "Không thể xóa giao dịch.");
                        }
                    },
                    style: "destructive"
                }
            ],
            { cancelable: false }
        );
    };

    const handleEdit = (transaction: Transaction) => {
        navigation.navigate('AddExpense', { transactionId: transaction.id });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.filterRow}>
                {["Ngày", "Tuần", "Tháng", "Tất cả"].map((filter) => (
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

            {loading ? (
                <ActivityIndicator size="large" color="#6DBDFF" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={transactions}
                    style={{paddingBottom: 50}}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const date = item.date.toDate();
                        const formatted =
                            date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) +
                            " - " +
                            date.toLocaleDateString("vi-VN");

                        return (
                            <TransactionItem
                                categoryName={item.categoryId}
                                description={item.decription}
                                time={formatted}
                                amount={item.amount}
                                type={item.type}
                                onDelete={() => handleDelete(item.id)}
                                onEdit={() => handleEdit(item)}
                            />
                        );
                    }}
                    contentContainerStyle={{ paddingTop: 10 }}
                />
            )}
        </SafeAreaView>
    );
};

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

export default TransactionScreen;