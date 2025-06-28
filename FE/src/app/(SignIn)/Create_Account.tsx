import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
    FlatList,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import {
    useFonts,
    Montserrat_400Regular,
    Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import mainStyles from "@/src/styles/mainStyle";
import { register } from "@/QuanLyTaiChinh-backend/userServices";
import {getAllFamily} from "@/QuanLyTaiChinh-backend/familyService";
import { User, Family } from "@/models/types";

export default function CreateAccountScreen() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showRePassword, setShowRePassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showFamilyModal, setShowFamilyModal] = useState(false);
    const [families, setFamilies] = useState<Family[]>([]);
    const [loadingFamilies, setLoadingFamilies] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        rePassword: "",
        selectedFamily: null as Family | null,
    });
    
    // Error states
    const [errors, setErrors] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        rePassword: "",
        family: "",
    });

    let [fontsLoaded] = useFonts({
        Montserrat_400Regular,
        Montserrat_700Bold,
    });

    // Load families when component mounts with retry mechanism
    useEffect(() => {
        const initializeFamilies = async () => {
            let retryCount = 0;
            const maxRetries = 3;
            
            const tryLoadFamilies = async (): Promise<void> => {
                try {
                    await loadFamilies();
                } catch (error) {
                    retryCount++;
                    if (retryCount < maxRetries) {
                        console.log(`Thử lại lần ${retryCount}...`);
                        setTimeout(tryLoadFamilies, 2000); // Đợi 2s rồi thử lại
                    }
                }
            };
            
            await tryLoadFamilies();
        };
        
        initializeFamilies();
    }, []);

    // Enhanced loadFamilies function with better error handling
    const loadFamilies = async () => {
        try {
            setLoadingFamilies(true);
            
            // Kiểm tra kết nối mạng đơn giản
            const isConnected = await checkNetworkConnection();
            if (!isConnected) {
                throw new Error("Không có kết nối internet");
            }
            
            const familyList = await getAllFamily();
            
            // Kiểm tra dữ liệu trả về
            if (Array.isArray(familyList)) {
                setFamilies(familyList);
            } else {
                console.warn("Dữ liệu gia đình không hợp lệ:", familyList);
                setFamilies([]);
                throw new Error("Dữ liệu không hợp lệ");
            }
        } catch (error: any) {
            console.error("Lỗi khi tải danh sách gia đình:", error);
            
            // Xử lý các loại lỗi khác nhau
            let errorMessage = "Không thể tải danh sách gia đình";
            
            if (error.message) {
                if (error.message.includes("network") || error.message.includes("internet")) {
                    errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra internet.";
                } else if (error.message.includes("timeout")) {
                    errorMessage = "Kết nối timeout. Vui lòng thử lại.";
                } else {
                    errorMessage = error.message;
                }
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            // Set empty array nếu có lỗi
            setFamilies([]);
            
            // Hiển thị alert với option thử lại
            Alert.alert("Lỗi", errorMessage, [
                {
                    text: "Thử lại",
                    onPress: () => loadFamilies()
                },
                {
                    text: "Bỏ qua",
                    style: "cancel"
                }
            ]);
        } finally {
            setLoadingFamilies(false);
        }
    };

    // Hàm kiểm tra kết nối mạng đơn giản
    const checkNetworkConnection = async (): Promise<boolean> => {
        try {
            // Tạo một fetch request đơn giản để kiểm tra kết nối
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch {
            return false;
        }
    };

    // Enhanced refresh function
    const handleRefreshFamilies = async () => {
        const isConnected = await checkNetworkConnection();
        
        if (!isConnected) {
            Alert.alert(
                "Lỗi kết nối", 
                "Không có kết nối internet. Vui lòng kiểm tra kết nối và thử lại.",
                [
                    {
                        text: "Thử lại",
                        onPress: handleRefreshFamilies
                    },
                    {
                        text: "Bỏ qua",
                        style: "cancel"
                    }
                ]
            );
            return;
        }
        
        await loadFamilies();
    };

    // Validation functions
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone: string): boolean => {
        const phoneRegex = /^[0-9]{10,11}$/;
        return phoneRegex.test(phone.replace(/\s/g, ""));
    };

    const validatePassword = (password: string): boolean => {
        return password.length >= 6;
    };

    // Handle input change
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error when user starts typing
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({
                ...prev,
                [field]: ""
            }));
        }
    };

    // Handle family selection
    const handleFamilySelect = (family: Family) => {
        setFormData(prev => ({
            ...prev,
            selectedFamily: family
        }));
        setShowFamilyModal(false);
        
        // Clear family error
        if (errors.family) {
            setErrors(prev => ({
                ...prev,
                family: ""
            }));
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors = {
            name: "",
            email: "",
            phone: "",
            password: "",
            rePassword: "",
            family: "",
        };

        // Validate name
        if (!formData.name.trim()) {
            newErrors.name = "Tên đầy đủ không được để trống";
        }

        // Validate email
        if (!formData.email.trim()) {
            newErrors.email = "Email không được để trống";
        } else if (!validateEmail(formData.email)) {
            newErrors.email = "Email không hợp lệ";
        }

        // Validate phone
        if (!formData.phone.trim()) {
            newErrors.phone = "Số điện thoại không được để trống";
        } else if (!validatePhone(formData.phone)) {
            newErrors.phone = "Số điện thoại không hợp lệ (10-11 số)";
        }

        // Validate password
        if (!formData.password) {
            newErrors.password = "Mật khẩu không được để trống";
        } else if (!validatePassword(formData.password)) {
            newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        }

        // Validate re-password
        if (!formData.rePassword) {
            newErrors.rePassword = "Vui lòng nhập lại mật khẩu";
        } else if (formData.password !== formData.rePassword) {
            newErrors.rePassword = "Mật khẩu nhập lại không khớp";
        }

        // Validate family selection
        if (!formData.selectedFamily) {
            newErrors.family = "Vui lòng chọn gia đình";
        }

        setErrors(newErrors);
        return Object.values(newErrors).every(error => error === "");
    };

    // Handle registration
    const handleRegister = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.replace(/\s/g, ""),
                password: formData.password,
                familyId: formData.selectedFamily!.id, // Set familyId to selected family's Id
                role: 'member', // Default role
            };

            const userId = await register(userData);
            
            // Save user ID to AsyncStorage for auto-login
            await AsyncStorage.setItem("userId", userId);
            
            Alert.alert(
                "Thành công", 
                "Đăng ký tài khoản thành công!",
                [
                    {
                        text: "OK",
                        onPress: () => router.replace('/CreateAccountfortrans')
                    }
                ]
            );
        } catch (error: any) {
            console.error("Lỗi đăng ký:", error);
            Alert.alert(
                "Lỗi đăng ký", 
                error.message || "Có lỗi xảy ra. Vui lòng thử lại!"
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Render family item in modal
    const renderFamilyItem = ({ item }: { item: Family }) => (
        <TouchableOpacity
            style={styles.familyItem}
            onPress={() => handleFamilySelect(item)}
        >
            <View style={styles.familyInfo}>
                <Text style={styles.familyName}>{item.name}</Text>
                <Text style={styles.familyAddress}>{item.address || "Chưa có địa chỉ"}</Text>
                <Text style={styles.familyMembers}>
                    {item.membersId?.length || 0} thành viên
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A0AFC0" />
        </TouchableOpacity>
    );

    // Enhanced empty component with retry option
    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#A0AFC0" />
            <Text style={styles.emptyText}>
                {loadingFamilies ? "Đang tải..." : "Không có gia đình nào"}
            </Text>
            {!loadingFamilies && (
                <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={handleRefreshFamilies}
                >
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    if (!fontsLoaded) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <SafeAreaView style={mainStyles.container}>
            <SafeAreaView style={[mainStyles.topSheet, { padding: 0 }]} />
            <View style={mainStyles.bottomeSheet}>
                <ScrollView
                    contentContainerStyle={{ alignItems: "center" }}
                    showsVerticalScrollIndicator={false}>
                    
                    <Text style={styles.label}>Tên đầy đủ</Text>
                    <TextInput
                        style={[styles.input, errors.name && styles.inputError]}
                        placeholder="Nhập tên đầy đủ"
                        placeholderTextColor="#A0AFC0"
                        value={formData.name}
                        onChangeText={(text) => handleInputChange("name", text)}
                        editable={!isLoading}
                    />
                    {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
                    
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={[styles.input, errors.email && styles.inputError]}
                        placeholder="example@example.com"
                        placeholderTextColor="#A0AFC0"
                        value={formData.email}
                        onChangeText={(text) => handleInputChange("email", text)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!isLoading}
                    />
                    {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                    
                    <Text style={styles.label}>Số điện thoại</Text>
                    <TextInput
                        style={[styles.input, errors.phone && styles.inputError]}
                        placeholder="0123 456 789"
                        placeholderTextColor="#A0AFC0"
                        value={formData.phone}
                        onChangeText={(text) => handleInputChange("phone", text)}
                        keyboardType="phone-pad"
                        editable={!isLoading}
                    />
                    {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
                    
                    <Text style={styles.label}>Mật khẩu</Text>
                    <View style={styles.passwordRow}>
                        <TextInput
                            style={[styles.input, { flex: 1 }, errors.password && styles.inputError]}
                            placeholder="••••••••"
                            placeholderTextColor="#A0AFC0"
                            secureTextEntry={!showPassword}
                            value={formData.password}
                            onChangeText={(text) => handleInputChange("password", text)}
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword((v) => !v)}
                            disabled={isLoading}>
                            <Ionicons
                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                size={24}
                                color="#A0AFC0"
                                style={{ marginLeft: 8 }}
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                    
                    <Text style={styles.label}>Nhập lại mật khẩu</Text>
                    <View style={styles.passwordRow}>
                        <TextInput
                            style={[styles.input, { flex: 1 }, errors.rePassword && styles.inputError]}
                            placeholder="••••••••"
                            placeholderTextColor="#A0AFC0"
                            secureTextEntry={!showRePassword}
                            value={formData.rePassword}
                            onChangeText={(text) => handleInputChange("rePassword", text)}
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            onPress={() => setShowRePassword((v) => !v)}
                            disabled={isLoading}>
                            <Ionicons
                                name={showRePassword ? "eye-off-outline" : "eye-outline"}
                                size={24}
                                color="#A0AFC0"
                                style={{ marginLeft: 8 }}
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.rePassword ? <Text style={styles.errorText}>{errors.rePassword}</Text> : null}
                    
                    {/* Family Selection */}
                    <Text style={styles.label}>Chọn gia đình</Text>
                    <TouchableOpacity
                        style={[styles.familySelector, errors.family && styles.inputError]}
                        onPress={() => setShowFamilyModal(true)}
                        disabled={isLoading}
                    >
                        <Text style={[
                            styles.familySelectorText,
                            !formData.selectedFamily && styles.placeholderText
                        ]}>
                            {formData.selectedFamily ? formData.selectedFamily.name : "Chọn gia đình"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#A0AFC0" />
                    </TouchableOpacity>
                    {errors.family ? <Text style={styles.errorText}>{errors.family}</Text> : null}
                    
                    <Text style={styles.terms}>
                        Bằng việc tiếp tục, bạn chấp nhận{"\n"}
                        <Text style={styles.termsLink}>Điều khoản sử dụng</Text>{" "}
                        và{" "}
                        <Text style={styles.termsLink}>Chính sách quyền riêng tư</Text>.
                    </Text>
                    
                    <TouchableOpacity 
                        style={[styles.registerBtn, isLoading && styles.disabledBtn]} 
                        onPress={handleRegister}
                        disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#222" />
                        ) : (
                            <Text style={styles.registerBtnText}>Đăng Ký</Text>
                        )}
                    </TouchableOpacity>
                    
                    <View style={styles.bottomRow}>
                        <Text style={styles.bottomText}>Đã có tài khoản? </Text>
                        <Link href="/" style={styles.loginLink}>
                            Đăng nhập
                        </Link>
                    </View>
                </ScrollView>
            </View>

            {/* Family Selection Modal */}
            <Modal
                visible={showFamilyModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFamilyModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn gia đình</Text>
                            <TouchableOpacity
                                onPress={() => setShowFamilyModal(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#222" />
                            </TouchableOpacity>
                        </View>
                        
                        {loadingFamilies ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#4A90E2" />
                                <Text style={styles.loadingText}>Đang tải danh sách gia đình...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={families}
                                renderItem={renderFamilyItem}
                                keyExtractor={(item) => item.id}
                                style={styles.familyList}
                                showsVerticalScrollIndicator={false}
                                refreshing={loadingFamilies}
                                onRefresh={handleRefreshFamilies}
                                ListEmptyComponent={renderEmptyComponent}
                            />
                        )}
                        
                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={handleRefreshFamilies}
                            disabled={loadingFamilies}
                        >
                            <Ionicons name="refresh" size={20} color="#4A90E2" />
                            <Text style={styles.refreshButtonText}>Làm mới</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <StatusBar style="auto" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#97A2FF", alignItems: "center" },
    topBackground: {
        width: "100%",
        height: 100,
        backgroundColor: "#97A2FF",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 12,
    },
    header: { 
        color: "#fff", 
        fontSize: 24, 
        fontWeight: "bold", 
        marginTop: 40,
        fontFamily: "Montserrat_700Bold",
    },
    formContainer: {
        backgroundColor: "#fff",
        borderRadius: 40,
        width: "100%",
        height: "100%",
        padding: 24,
        alignItems: "center",
        marginTop: 24,
    },
    label: {
        alignSelf: "flex-start",
        color: "#222",
        fontWeight: "bold",
        marginTop: 12,
        marginBottom: 4,
        fontFamily: "Montserrat_700Bold",
    },
    input: {
        backgroundColor: "#D6EAF8",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        width: "100%",
        marginBottom: 4,
        fontFamily: "Montserrat_400Regular",
    },
    inputError: {
        borderWidth: 1,
        borderColor: "#FF6B6B",
    },
    errorText: {
        color: "#FF6B6B",
        fontSize: 12,
        alignSelf: "flex-start",
        marginBottom: 8,
        fontFamily: "Montserrat_400Regular",
    },
    passwordRow: { 
        flexDirection: "row", 
        alignItems: "center", 
        width: "100%",
        marginBottom: 4,
    },
    familySelector: {
        backgroundColor: "#D6EAF8",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        width: "100%",
        marginBottom: 4,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: 48,
    },
    familySelectorText: {
        fontSize: 16,
        color: "#222",
        fontFamily: "Montserrat_400Regular",
        flex: 1,
    },
    placeholderText: {
        color: "#A0AFC0",
    },
    terms: {
        color: "#222",
        fontSize: 13,
        textAlign: "center",
        marginVertical: 16,
        fontFamily: "Montserrat_400Regular",
    },
    termsLink: { 
        color: "#4A90E2", 
        textDecorationLine: "underline",
        fontFamily: "Montserrat_700Bold",
    },
    registerBtn: {
        backgroundColor: "#B9CFFF",
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 32,
        marginTop: 8,
        marginBottom: 8,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        height: 48,
    },
    registerBtnText: { 
        color: "#222", 
        fontWeight: "bold", 
        fontSize: 18,
        fontFamily: "Montserrat_700Bold",
    },
    disabledBtn: {
        opacity: 0.6,
    },
    bottomRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
    },
    bottomText: { 
        color: "#222", 
        fontSize: 15,
        fontFamily: "Montserrat_400Regular",
    },
    loginLink: {
        color: "#4A90E2",
        fontWeight: "bold",
        fontSize: 15,
        textDecorationLine: "underline",
        fontFamily: "Montserrat_700Bold",
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
        maxHeight: "80%",
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#222",
        fontFamily: "Montserrat_700Bold",
    },
    closeButton: {
        padding: 4,
    },
    familyList: {
        maxHeight: 400,
    },
    familyItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    familyInfo: {
        flex: 1,
    },
    familyName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#222",
        fontFamily: "Montserrat_700Bold",
        marginBottom: 4,
    },
    familyAddress: {
        fontSize: 14,
        color: "#666",
        fontFamily: "Montserrat_400Regular",
        marginBottom: 2,
    },
    familyMembers: {
        fontSize: 12,
        color: "#4A90E2",
        fontFamily: "Montserrat_400Regular",
    },
    loadingContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    loadingText: {
        marginTop: 12,
        color: "#666",
        fontFamily: "Montserrat_400Regular",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    emptyText: {
        color: "#666",
        fontSize: 16,
        fontFamily: "Montserrat_400Regular",
        marginTop: 12,
        textAlign: "center",
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: "#4A90E2",
        borderRadius: 8,
    },
    retryButtonText: {
        color: "#fff",
        fontFamily: "Montserrat_700Bold",
        fontSize: 14,
    },
    refreshButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        margin: 16,
        padding: 12,
        backgroundColor: "#F8F9FA",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#4A90E2",
    },
    refreshButtonText: {
        marginLeft: 8,
        color: "#4A90E2",
        fontWeight: "bold",
        fontFamily: "Montserrat_700Bold",
    },
});