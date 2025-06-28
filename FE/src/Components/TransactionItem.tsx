import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  MaterialIcons,
} from '@expo/vector-icons';

// Map icon theo danh mục
const iconMap: Record<string, React.ReactNode> = {
  "E37UjPrJI31i6Y8OvaXd": <Ionicons name="restaurant-outline" size={25} color="#fff" />,
  "A2hY1i3ufTg2wYxel6mm": <MaterialIcons name="directions-bus" size={25} color="#fff" />,
  "rCBzyC3RAfCzRTb07eQG": <FontAwesome5 name="briefcase-medical" size={25} color="#fff" />,
  "Ejn4tA6UwLEGIKCEkukz": <MaterialCommunityIcons name="shopping-outline" size={25} color="#fff" />,
  "wtGlQieVaXi6V738rlhB": <Ionicons name="home-outline" size={25} color="#fff" />,
  "kpQFCoAPo1hVyaDWj6cN": <MaterialCommunityIcons name="gift-outline" size={25} color="#fff" />,
  "dddIQLSmlGvea2Jyo5Ou": <FontAwesome5 name="piggy-bank" size={25} color="#fff" />,
  "tffBd2y3TdsRpWxWBH05": <MaterialIcons name="sports-esports" size={25} color="#fff" />,
};

interface TransactionItemProps {
  categoryName: string;
  description: string;
  time: string;
  amount: number;
  type: "income" | "expense";
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  categoryName,
  description,
  time,
  amount,
  type
}) => {
  const isIncome = type === 'income';

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={[styles.iconWrapper, { backgroundColor: '#6DBDFF' }]}>
          {iconMap[categoryName] || (
            <Ionicons name="help-circle-outline" size={28} color="#fff" />
          )}
        </View>
        <View style={styles.textInfo}>
          <Text style={styles.title}>{description}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
      </View>
      <Text style={[styles.amount, { color: isIncome ? '#007AFF' : 'red' }]}>
        {amount.toLocaleString('vi-VN')}
      </Text>
    </View>
  );
};

export default TransactionItem;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textInfo: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  time: {
    fontSize: 14,
    color: '#007AFF',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
