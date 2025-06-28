import { Timestamp } from 'firebase/firestore';
import { Family } from '../models/types'
import {
    addDocument,
    getDocument,
    updateDocument,
    deleteDocument,
    queryDocuments,
    listenDocument,
    getCollection,
    setDocument
} from './firestoreservices';
import { RealtimeListenerService  } from './RealtimeListenerService';
const COLLECTION_NAME = 'Family';
//lấy thông tin một trong số các thuộc tính
export const getFamilyField = async <K extends keyof Family>(familyId: string, field: K)
:Promise<Family[K] | null> =>{
    try{
        const family = await getDocument<Family>(COLLECTION_NAME, familyId);
        if(!family)
        {
            return null;
        }
        return family[field];
    }catch (error) {
        console.error(`Lỗi khi lấy trường ${String(field)} từ gia đình ${familyId}:`, error);
        throw error;
    }
};
//tạo gia đình
export const addFaimly = async (familyData: Omit<Family, 'Id'| 'createdAt'| 'updatedAt'>)
:Promise<string> =>
{
    return await addDocument(COLLECTION_NAME,familyData);
};
//lấy thông tin gia đình bằng id
export const getFamilybyId = async ( familyId: string)
:Promise<Family | null> =>{
    return await getDocument<Family>(COLLECTION_NAME,familyId);
}
//tìm gia đình bằng Id thành viên
export const getFamilyIdByMemberId = async ( memberId: string)
:Promise<Family[] | null> =>
{
    return await queryDocuments<Family>(COLLECTION_NAME,[{
        field: 'membersId', operator: 'array-contains', value: memberId
    }]);
}
//cập nhật thông tin gia đình
export const updateFamily = async ( getFamilyId: string, familyData: Partial<Family>)
:Promise<void> =>{
    return await updateDocument(COLLECTION_NAME,getFamilyId,familyData);
}
//xóa gia đình
export const deleteFamily = async (familyId: string)
:Promise<void> =>{
    return await deleteDocument(COLLECTION_NAME,familyId);
}
//Thêm thành viên
export const addMember = async(familyId: string, memberId: string): 
Promise<void> =>{
    const family = await getFamilybyId(familyId);
    if(family)
    {
        if(!family.membersId.includes(memberId))
        {
            const updateMember = [...family.membersId, memberId];
            await updateDocument(COLLECTION_NAME,familyId,{membersId: updateMember});
        }
        else{
            return;
        }
        
    }
    else
    {
        const newFamily: Omit<Family, 'updatedAt' | 'createdAt'> = {
            id: familyId,
            name: "New",
            adminId: memberId,
            address: "",
            membersId: [memberId],
        }
        await setDocument(COLLECTION_NAME,familyId,newFamily);
    }
};
//xóa thành viên gia đình
export const removeMembers = async (familyId: string, memberId: string)
:Promise<void> =>{
    const family = await getFamilybyId(familyId);
    if(family)
    {
        const updateMember = family.membersId.filter(id =>id !== memberId);
        await updateDocument(COLLECTION_NAME,familyId, {membersId: updateMember});
    }
};
//lắng nghe thay đổi
export const listenToFamily = async(userId: string,callback: (user: Family | null) => void ) =>
{ 
  const realtimeService = new RealtimeListenerService()
  return realtimeService.listenToDocument<Family>(COLLECTION_NAME, userId, callback);
}
// Lấy toàn bộ danh sách các gia đình
export const getAllFamily = async (): Promise<Family[]> => {
    try {
        const families = await getCollection<Family>(COLLECTION_NAME);
        return families;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách tất cả các gia đình:', error);
        throw error;
    }
};
