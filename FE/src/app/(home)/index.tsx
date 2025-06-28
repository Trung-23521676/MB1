import {View, Text} from 'react-native';
import styles from '../../styles/mainStyle';
import SavingsGoalCard from '../../Components/SavingGoalCard';
import TransactionScreen from '../../Components/TransactionSummary';
import GreetingHeader from '../../Components/HomeHeader';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import mainStyles from '@/src/styles/mainStyle';
import AddButton from '@/src/Components/AddButton';
import {analyzeSpending} from '@/gpt';

const spendingData = `
- 01/06: Mua cà phê 40,000 VND
- 01/06: Ăn trưa 75,000 VND
- 02/06: Mua sách 120,000 VND
- 03/06: Thanh toán điện 300,000 VND
- 04/06: Gửi tiết kiệm 500,000 VND
`;


export default function HomeScreen() {
    // const result = analyzeSpending(spendingData);

    return (
        <SafeAreaView style={mainStyles.container}>
            <SafeAreaView style={[mainStyles.topSheet, {padding: 16}]}>
                <GreetingHeader />
            </SafeAreaView>
            <View style={mainStyles.bottomeSheet}>
                <SavingsGoalCard />
                {/* <Text>{result}</Text> */}
                <View style={{padding: 4}}></View>
                <TransactionScreen  />
            </View>
        </SafeAreaView>
    );
}