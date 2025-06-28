import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import SettingTemplate from "@/src/Components/SettingTemplate";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import mainStyles from "@/src/styles/mainStyle";

export default function SettingsScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={mainStyles.container}>
            <SafeAreaView style={[mainStyles.topSheet, { padding: 0 }]} />
            <View style={mainStyles.bottomeSheet}>

              {/* <TouchableOpacity
                  style={styles.row}
                  onPress={() => router.push("/NotiSetting")}>
                  <View style={styles.iconCircle}>
                      <Ionicons
                          name="notifications-outline"
                          size={22}
                          color="#6EB5FF"
                      />
                  </View>
                  <Text style={styles.rowText}>Cài Đặt Thông Báo</Text>
                  <Ionicons name="chevron-forward" size={22} color="#000" />
              </TouchableOpacity> */}
              <TouchableOpacity
                  style={styles.row}
                  onPress={() => router.push("/ChangePassword")}>
                  <View style={styles.iconCircle}>
                      <Ionicons
                          name="lock-closed-outline"
                          size={22}
                          color="#6EB5FF"
                      />
                  </View>
                  <Text style={styles.rowText}>Cài Đặt Mật Khẩu</Text>
                  <Ionicons name="chevron-forward" size={22} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity
                  style={styles.row}
                  onPress={() => router.push("/DeleteAccount")}>
                  <View style={styles.iconCircle}>
                      <MaterialCommunityIcons
                          name="account-remove-outline"
                          size={22}
                          color="#6EB5FF"
                      />
                  </View>
                  <Text style={styles.rowText}>Xoá Tài Khoản</Text>
                  <Ionicons name="chevron-forward" size={22} color="#000" />
              </TouchableOpacity>
              {/* <TouchableOpacity
                  style={styles.row}
                  onPress={() => router.push("/AISettings")}>
                  <View style={styles.iconCircle}>
                      <Ionicons
                          name="chatbubble-ellipses-outline"
                          size={22}
                          color="#6EB5FF"
                      />
                  </View>
                  <Text style={styles.rowText}>AI ChatBot</Text>
                  <Ionicons name="chevron-forward" size={22} color="#000" />
              </TouchableOpacity> */}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#E3F3FF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    rowText: {
        flex: 1,
        fontSize: 15,
        color: "#145A5A",
        fontFamily: "Montserrat_700Bold",
    },
});
