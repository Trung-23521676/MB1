import React, {use, useEffect, useState} from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { User, Account } from '@/models/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAccountById, getAccountByUserId } from '../../QuanLyTaiChinh-backend/accountServices';

const GreetingHeader = ({
    wallet = 5000000,
    expense = 3750000,
}) => {
    const [userId, setUserId] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [accounts, setAccounts] = useState<Account | null>(null);
    useEffect(() => {
        const fetchUserId = async () => {
            const id = await AsyncStorage.getItem('userId');
            console.log('Fetched userId:', id); // Thêm dòng này
            setUserId(id);
        };
        fetchUserId();
    }, []);
    useEffect(() => {
    const fetchAccount = async () => {
        if (userId) {
            try {
                const accountData = await getAccountByUserId(userId);
                
                if (!accountData || accountData.length === 0) {
                    console.log('No accounts found for user:', userId);
                    setAccounts(null);
                } else {
                    console.log('Fetched accounts:', accountData);
                    setAccounts(accountData[0]); // ← Lấy account đầu tiên
                }
            } catch (error) {
                console.error('Error fetching accounts:', error);
                setAccounts(null);
            }
        }
    };
    fetchAccount();
}, [userId]); // ← Sửa dependency
    return (
        <SafeAreaView style={styles.container}>
            {/* Summary row */}
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
                    <Text style={styles.amount}>{accounts?.balance.toString()}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.block}>
                    <View style={styles.labelRow}>
                        <Ionicons
                            name="trending-down-outline"
                            size={16}
                            color="#fff"
                        />
                        <Text style={styles.label}>Tổng chi</Text>
                    </View>
                    <Text style={styles.amount}>
                        {accounts?.initialBalance.toString()}
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default GreetingHeader;

const styles = StyleSheet.create({
    container: {
        // backgroundColor: '#6DBDFF',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        // padding: 16,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    greeting: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
    subGreeting: {
        fontSize: 14,
        color: "#fff",
        // marginTop: 4,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        // marginTop: 20,
        alignItems: "center",
    },
    block: {
        alignItems: "center",
        flex: 1,
    },
    labelRow: {
        flexDirection: "row",
        alignItems: "center",
        // marginBottom: 6,
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
        // marginHorizontal: 10,
    },
});
