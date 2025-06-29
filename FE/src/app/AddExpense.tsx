import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Modal,
    ScrollView,
    Alert,
} from "react-native";
import {
    Ionicons,
} from "@expo/vector-icons";
import {
    useFonts,
    Montserrat_700Bold,
    Montserrat_400Regular,
} from "@expo-google-fonts/montserrat";
import { useRouter, useLocalSearchParams } from "expo-router";
import mainStyles from "../styles/mainStyle";
import { 
    createTransaction, 
    updateTransaction, 
    getTransactionById 
} from "@/QuanLyTaiChinh-backend/transactionServices";
import { Transaction, User, Category, Account } from "@/models/types";
import { getUserById } from "@/QuanLyTaiChinh-backend/userServices";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    getAllCategories,
    getCategoryByName,
} from "@/QuanLyTaiChinh-backend/categoryServices";
import { getAccountByUserId } from "@/QuanLyTaiChinh-backend/accountServices";
import { Timestamp } from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRefresh } from "@/src/context/refreshContext";

const defaultCategories = [
    {
        icon: <Ionicons name="restaurant-outline" size={28} color="#7EC6FF" />,
        label: "Ăn Uống",
    },
    {
        icon: <Ionicons name="bus-outline" size={28} color="#7EC6FF" />,
        label: "Di Chuyển",
    },
    {
        icon: <Ionicons name="pulse-outline" size={28} color="#7EC6FF" />,
        label: "Y Tế",
    },
    {
        icon: <Ionicons name="cart-outline" size={28} color="#7EC6FF" />,
        label: "Mua Sắm",
    },
    {
        icon: <Ionicons name="home-outline" size={28} color="#7EC6FF" />,
        label: "Nơi Ở",
    },
    {
        icon: <Ionicons name="gift-outline" size={28} color="#7EC6FF" />,
        label: "Quà Tặng",
    },
    {
        icon: <Ionicons name="server-outline" size={28} color="#7EC6FF" />,
        label: "Tiết Kiệm",
    },
    {
        icon: <Ionicons name="game-controller-outline" size={28} color="#7EC6FF" />,
        label: "Giải Trí",
    },
];

export default function AddExpenseScreen() {
    const [fontsLoaded] = useFonts({
        Montserrat_700Bold,
        Montserrat_400Regular,
    });

    const router = useRouter();
    const params = useLocalSearchParams();
    const { transactionId: paramTransactionId } = params;
    const { triggerRefresh } = useRefresh();

    const [categoryModal, setCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [expenseDate, setExpenseDate] = useState(new Date());
    const [expenseAmount, setExpenseAmount] = useState("");
    const [note, setNote] = useState("");
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");
    const [userId, setUserId] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const id = await AsyncStorage.getItem("userId");
                setUserId(id);
            } catch (error) {
                console.error("Error fetching userId:", error);
            }
        };
        fetchUserId();
    }, []);

    useEffect(() => {
        const fetchCategoriesAndSetup = async () => {
            try {
                const allCategories = await getAllCategories();
                if (allCategories && Array.isArray(allCategories)) {
                    setCategories(allCategories);

                    if (paramTransactionId && typeof paramTransactionId === 'string') {
                        setIsEditMode(true);
                        setLoading(true);
                        const transactionToEdit = await getTransactionById(paramTransactionId);
                        if (transactionToEdit) {
                            setExpenseAmount(transactionToEdit.amount.toString());
                            setNote(transactionToEdit.decription);
                            setTransactionType(transactionToEdit.type);
                            
                            const category = allCategories.find(c => c.id === transactionToEdit.categoryId);
                            if (category) {
                                setSelectedCategory(category.name);
                            }
                        }
                        setLoading(false);
                    }
                } else {
                    setCategories([]);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
                setCategories([]);
            }
        };
        fetchCategoriesAndSetup();
    }, [paramTransactionId]);

    const safeString = (value: any): string => {
        if (value === null || value === undefined) return "";
        if (typeof value === "string") return value;
        return String(value);
    };

    const safeParseArrayResponse = (response: any): any[] => {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (typeof response === "object") return [response];
        return [];
    };

    const handleSaveTransaction = async () => {
        if (!selectedCategory || safeString(selectedCategory).trim() === "") {
            Alert.alert("Lỗi", "Vui lòng chọn danh mục");
            return;
        }
        const amountStr = safeString(expenseAmount).trim();
        if (!amountStr || isNaN(parseFloat(amountStr))) {
            Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ");
            return;
        }
        if (!userId) {
            Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
            return;
        }

        setLoading(true);
        try {
            const category = categories.find(c => c.name === selectedCategory);
            if (!category) {
                Alert.alert("Lỗi", "Danh mục không hợp lệ.");
                setLoading(false);
                return;
            }
            const categoryId = category.id;

            const accountResponse = await getAccountByUserId(userId);
            const accountArray = safeParseArrayResponse(accountResponse);
            if (accountArray.length === 0) {
                Alert.alert("Lỗi", "Không tìm thấy tài khoản người dùng.");
                setLoading(false);
                return;
            }
            const accountId = accountArray[0]?.Id || accountArray[0]?.id;

            const transactionData = {
                amount: Math.abs(parseFloat(amountStr)),
                date: Timestamp.fromDate(new Date(expenseDate)),
                type: transactionType,
                categoryId: categoryId,
                decription: safeString(note),
                userId: userId,
                accountId: accountId,
            };

            const handleSuccess = (title: string, message: string) => {
                Alert.alert(title, message, [
                    { 
                        text: "OK", 
                        onPress: () => {
                            triggerRefresh();
                            router.back();
                        } 
                    },
                ]);
            };

            if (isEditMode && typeof paramTransactionId === 'string') {
                await updateTransaction(paramTransactionId, transactionData);
                handleSuccess("Thành công", "Đã cập nhật giao dịch");
            } else {
                await createTransaction(transactionData);
                handleSuccess("Thành công", "Đã thêm giao dịch thành công");
            }

        } catch (error) {
            console.error("Lỗi khi lưu giao dịch:", error);
            Alert.alert("Lỗi", "Không thể lưu giao dịch. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    if (!fontsLoaded || (loading && isEditMode)) {
        return null;
    }

    return (
        <KeyboardAwareScrollView
            enableOnAndroid
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
            style={{ flex: 1 }}>
            <SafeAreaView style={mainStyles.container}>
                <SafeAreaView style={[mainStyles.topSheet, {padding: 0}]}/>
                <View style={mainStyles.bottomeSheet}>
                    <View style={styles.inputSection}>
                        <Text style={styles.label}>Danh mục</Text>
                        <TouchableOpacity
                            style={styles.categoryButton}
                            onPress={() => setCategoryModal(true)}>
                            <Text
                                style={[
                                    styles.categoryButtonText,
                                    !selectedCategory && styles.placeholderText,
                                ]}>
                                {selectedCategory || "Chọn danh mục"}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputSection}>
                        <Text style={styles.label}>Số tiền</Text>
                        <TextInput
                            style={styles.textInput}
                            value={expenseAmount}
                            onChangeText={setExpenseAmount}
                            placeholder="Nhập số tiền"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputSection}>
                        <Text style={styles.label}>Ghi chú</Text>
                        <TextInput
                            style={[styles.textInput, styles.noteInput]}
                            value={note}
                            onChangeText={setNote}
                            placeholder="Thêm ghi chú (tùy chọn)"
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.typeToggle}>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                transactionType === "expense" &&
                                    styles.activeToggle,
                            ]}
                            onPress={() => setTransactionType("expense")}
                            activeOpacity={0.7}>
                            <Text
                                style={[
                                    styles.toggleText,
                                    transactionType === "expense" &&
                                        styles.activeToggleText,
                                ]}>
                                Chi Tiêu
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                transactionType === "income" && styles.activeToggle,
                            ]}
                            onPress={() => setTransactionType("income")}
                            activeOpacity={0.7}>
                            <Text
                                style={[
                                    styles.toggleText,
                                    transactionType === "income" &&
                                        styles.activeToggleText,
                                ]}>
                                Thu Nhập
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.addButton, loading && styles.disabledButton]}
                        onPress={handleSaveTransaction}
                        disabled={loading}
                        activeOpacity={0.7}>
                        <Text style={styles.addButtonText}>
                            {loading ? "Đang xử lý..." : (isEditMode ? "Lưu Thay Đổi" : "Thêm Giao Dịch")}
                        </Text>
                    </TouchableOpacity>
                </View>

                <Modal
                    visible={categoryModal}
                    transparent={true}
                    animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Chọn Danh Mục</Text>
                                <TouchableOpacity
                                    onPress={() => setCategoryModal(false)}>
                                    <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.categoriesContainer}>
                                {defaultCategories.map((category, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.categoryItem,
                                            selectedCategory === category.label &&
                                                styles.selectedCategoryItem,
                                        ]}
                                        onPress={() => {
                                            setSelectedCategory(category.label);
                                            setCategoryModal(false);
                                        }}>
                                        {category.icon}
                                        <Text
                                            style={[
                                                styles.categoryLabel,
                                                selectedCategory ===
                                                    category.label &&
                                                    styles.selectedCategoryLabel,
                                            ]}>
                                            {category.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </KeyboardAwareScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    contentContainer: {
        flex: 1,
        paddingTop: 30,
        paddingHorizontal: 10,
        justifyContent: "space-between",
    },
    typeToggle: {
        flexDirection: "row",
        marginHorizontal: 10,
        marginVertical: 15,
        backgroundColor: "#f5f5f5",
        borderRadius: 25,
        padding: 5,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: "center",
        borderRadius: 20,
    },
    activeToggle: {
        backgroundColor: "#7EC6FF",
        shadowColor: "#7EC6FF",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    toggleText: {
        fontSize: 16,
        color: "#666",
        fontWeight: "500",
    },
    activeToggleText: {
        color: "#fff",
        fontWeight: "bold",
    },
    inputSection: {
        marginHorizontal: 10,
        marginBottom: 18,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 10,
    },
    textInput: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: "#f9f9f9",
        minHeight: 50,
    },
    noteInput: {
        height: 90,
        textAlignVertical: "top",
    },
    categoryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        padding: 16,
        backgroundColor: "#f9f9f9",
        minHeight: 50,
    },
    categoryButtonText: {
        fontSize: 16,
        color: "#333",
    },
    placeholderText: {
        color: "#999",
    },
    addButton: {
        backgroundColor: "#7EC6FF",
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 10,
        marginBottom: 20,
        alignItems: "center",
        shadowColor: "#7EC6FF",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.29,
        shadowRadius: 4.65,
        elevation: 7,
    },
    disabledButton: {
        backgroundColor: "#ccc",
        shadowOpacity: 0,
        elevation: 0,
    },
    addButtonText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "bold",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "70%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    categoriesContainer: {
        padding: 10,
    },
    categoryItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        marginVertical: 5,
        borderRadius: 10,
        backgroundColor: "#f9f9f9",
    },
    selectedCategoryItem: {
        backgroundColor: "#E3F2FD",
        borderColor: "#7EC6FF",
        borderWidth: 1,
    },
    categoryLabel: {
        marginLeft: 15,
        fontSize: 16,
        color: "#333",
    },
    selectedCategoryLabel: {
        color: "#7EC6FF",
        fontWeight: "600",
    },
});