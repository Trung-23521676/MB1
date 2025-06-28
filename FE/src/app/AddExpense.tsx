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
    MaterialIcons,
    FontAwesome5,
    MaterialCommunityIcons,
    Entypo,
} from "@expo/vector-icons";
import {
    useFonts,
    Montserrat_700Bold,
    Montserrat_400Regular,
} from "@expo-google-fonts/montserrat";
import { useRouter, useLocalSearchParams } from "expo-router";
import mainStyles from "../styles/mainStyle";
import { createTransaction } from "@/QuanLyTaiChinh-backend/transactionServices";
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
// hoặc nếu dùng v8
// import { Timestamp } from '@firebase/firestore-types';
// Categories from Categories.tsx
const defaultCategories = [
    {
        icon: <Ionicons name="restaurant-outline" size={28} color="#7EC6FF" />,
        label: "Ăn Uống",
    },
    {
        icon: <MaterialIcons name="directions-bus" size={28} color="#7EC6FF" />,
        label: "Di Chuyển",
    },
    {
        icon: (
            <FontAwesome5 name="briefcase-medical" size={24} color="#7EC6FF" />
        ),
        label: "Y Tế",
    },
    {
        icon: (
            <MaterialCommunityIcons
                name="shopping-outline"
                size={28}
                color="#7EC6FF"
            />
        ),
        label: "Mua Sắm",
    },
    {
        icon: <Ionicons name="home-outline" size={28} color="#7EC6FF" />,
        label: "Nơi Ở",
    },
    {
        icon: (
            <MaterialCommunityIcons
                name="gift-outline"
                size={28}
                color="#7EC6FF"
            />
        ),
        label: "Quà Tặng",
    },
    {
        icon: <FontAwesome5 name="piggy-bank" size={24} color="#7EC6FF" />,
        label: "Tiết Kiệm",
    },
    {
        icon: <MaterialIcons name="sports-esports" size={28} color="#7EC6FF" />,
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

    const [categoryModal, setCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        null
    );
    const [expenseName, setExpenseName] = useState("");
    const [expenseDate, setExpenseDate] = useState(new Date());
    const [expenseAmount, setExpenseAmount] = useState("");
    const [note, setNote] = useState("");
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [transactionType, setTransactionType] = useState<
        "income" | "expense"
    >("expense");

    const [userId, setUserId] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // Fetch userId
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

    // Fetch user data
    useEffect(() => {
        const fetchUser = async () => {
            if (userId) {
                try {
                    const userData = await getUserById(userId);
                    console.log("Fetched user:", userData);
                    setUser(userData);
                } catch (error) {
                    console.error("Error fetching user:", error);
                }
            }
        };
        fetchUser();
    }, [userId]);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const allCategories = await getAllCategories();
                if (allCategories && Array.isArray(allCategories)) {
                    setCategories(allCategories);
                } else {
                    console.log("No categories found or invalid format");
                    setCategories([]);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
                setCategories([]);
            }
        };
        fetchCategories();
    }, []);

    // Auto-select category if passed from params
    useEffect(() => {
        if (params?.defaultCategory) {
            const found = defaultCategories.find(
                (c) => c.label === params.defaultCategory
            );
            if (found) setSelectedCategory(found.label);
        }
    }, [params]);

    // Helper function to safely get string value
    const safeString = (value: any): string => {
        if (value === null || value === undefined) return "";
        if (typeof value === "string") return value;
        return String(value);
    };

    // Helper function to safely parse array response
    const safeParseArrayResponse = (response: any, itemName: string): any[] => {
        if (!response) {
            console.log(`${itemName} response is null or undefined`);
            return [];
        }

        if (Array.isArray(response)) {
            return response;
        }

        // If it's an object, try to convert to array
        if (typeof response === "object") {
            console.log(`${itemName} is object, converting to array`);
            return [response];
        }

        console.log(`${itemName} is not array or object:`, typeof response);
        return [];
    };

    // Hàm thêm transaction - ĐÃ SỬA LỖI
    const handleAddTransaction = async () => {
        // Validate input with safe string conversion
        if (!selectedCategory || safeString(selectedCategory).trim() === "") {
            Alert.alert("Lỗi", "Vui lòng chọn danh mục");
            return;
        }

        if (!expenseName || safeString(expenseName).trim() === "") {
            Alert.alert("Lỗi", "Vui lòng nhập tên giao dịch");
            return;
        }

        const amountStr = safeString(expenseAmount).trim();
        if (!amountStr || isNaN(parseFloat(amountStr))) {
            Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ");
            return;
        }

        if (!userId || safeString(userId).trim() === "") {
            Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
            return;
        }

        setLoading(true);
        try {
            console.log("=== Bắt đầu xử lý transaction ===");
            console.log("Selected category name:", selectedCategory);
            console.log("User ID:", userId);

            // Kiểm tra và lấy categoryId với error handling tốt hơn
            let categoryResponse = null;
            let categoryId = null;

            try {
                categoryResponse = await getCategoryByName(
                    safeString(selectedCategory)
                );
                console.log(
                    "getCategoryByName raw response:",
                    categoryResponse
                );

                const categoryArray = safeParseArrayResponse(
                    categoryResponse,
                    "Category"
                );

                if (categoryArray.length === 0) {
                    console.log(
                        "No category found with name:",
                        selectedCategory
                    );
                    Alert.alert("Lỗi", "Danh mục không tồn tại trong hệ thống");
                    return;
                }

                categoryId = categoryArray[0]?.Id || categoryArray[0]?.id;

                if (!categoryId) {
                    console.log("Category found but no ID:", categoryArray[0]);
                    Alert.alert("Lỗi", "Dữ liệu danh mục không hợp lệ");
                    return;
                }

                console.log("Found category ID:", categoryId);
            } catch (categoryError) {
                console.error(
                    "Error calling getCategoryByName:",
                    categoryError
                );
                Alert.alert(
                    "Lỗi",
                    "Không thể truy cập dữ liệu danh mục. Vui lòng thử lại."
                );
                return;
            }

            // Kiểm tra và lấy accountId với error handling tốt hơn
            let accountResponse = null;
            let accountId = null;

            try {
                accountResponse = await getAccountByUserId(safeString(userId));
                console.log(
                    "getAccountByUserId raw response:",
                    accountResponse
                );

                const accountArray = safeParseArrayResponse(
                    accountResponse,
                    "Account"
                );

                if (accountArray.length === 0) {
                    console.log("No account found for userId:", userId);
                    Alert.alert(
                        "Lỗi",
                        "Không tìm thấy tài khoản của người dùng"
                    );
                    return;
                }

                accountId = accountArray[0]?.Id || accountArray[0]?.id;

                if (!accountId) {
                    console.log("Account found but no ID:", accountArray[0]);
                    Alert.alert("Lỗi", "Dữ liệu tài khoản không hợp lệ");
                    return;
                }

                console.log("Found account ID:", accountId);
            } catch (accountError) {
                console.error(
                    "Error calling getAccountByUserId:",
                    accountError
                );
                Alert.alert(
                    "Lỗi",
                    "Không thể truy cập dữ liệu tài khoản. Vui lòng thử lại."
                );
                return;
            }
            const d = Timestamp.fromDate(new Date(expenseDate));

            // Tạo transaction object với safe string conversion
            const transaction: Omit<
                Transaction,
                "id" | "createdAt" | "updatedAt"
            > = {
                amount: Math.abs(parseFloat(safeString(expenseAmount))), // Luôn lưu số dương
                date: d,
                type: transactionType, // Sử dụng trực tiếp từ state
                categoryId: safeString(categoryId),
                decription: safeString(note), // Sửa lỗi chính tả từ "decription" thành "description"
                userId: safeString(userId),
                accountId: safeString(accountId),
            };

            console.log("Transaction object:", transaction);

            // Validate transaction object before sending
            if (
                !transaction.categoryId ||
                !transaction.userId ||
                !transaction.accountId
            ) {
                console.error("Invalid transaction data:", transaction);
                Alert.alert("Lỗi", "Dữ liệu giao dịch không hợp lệ");
                return;
            }

            // Tạo transaction
            const result = await createTransaction(transaction);
            console.log("Create transaction result:", result);

            if (result) {
                Alert.alert("Thành công", "Đã thêm giao dịch thành công", [
                    {
                        text: "OK",
                        onPress: () => {
                            // Reset form
                            setSelectedCategory(null);
                            setExpenseName("");
                            setExpenseAmount("");
                            setNote("");
                            // Quay lại màn hình trước
                            router.back();
                        },
                    },
                ]);
            } else {
                Alert.alert(
                    "Lỗi",
                    "Không thể tạo giao dịch. Vui lòng thử lại."
                );
            }
        } catch (error) {
            console.error("=== Error details ===");
            console.error("Error object:", error);

            // Hiển thị thông báo lỗi chi tiết hơn cho developer
        } finally {
            setLoading(false);
        }
    };

    if (!fontsLoaded) {
        return null;
    }

    return (
        <SafeAreaView style={mainStyles.container}>
            <SafeAreaView style={[mainStyles.topSheet, {padding: 0}]}/>
            <View style={mainStyles.bottomeSheet}>
                {/* Category Selection */}
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

                {/* Transaction Name */}
                <View style={styles.inputSection}>
                    <Text style={styles.label}>Tên giao dịch</Text>
                    <TextInput
                        style={styles.textInput}
                        value={expenseName}
                        onChangeText={setExpenseName}
                        placeholder="Nhập tên giao dịch"
                        placeholderTextColor="#999"
                    />
                </View>

                {/* Amount */}
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

                {/* Note */}
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

                {/* Toggle Income/Expense */}
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

                {/* Add button */}
                <TouchableOpacity
                    style={[styles.addButton, loading && styles.disabledButton]}
                    onPress={handleAddTransaction}
                    disabled={loading}
                    activeOpacity={0.7}>
                    <Text style={styles.addButtonText}>
                        {loading ? "Đang thêm..." : "Thêm Giao Dịch"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Category Modal */}
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
    // Modal styles
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
