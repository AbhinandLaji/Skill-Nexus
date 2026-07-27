import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatArea from '../components/ChatArea';
import MessageInput from '../components/MessageInput';

const INITIAL_MESSAGES = [
  {
    id: '1',
    type: 'text',
    authorName: 'alex_dev',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0Jii_4uF4eT0LTY9NdOf_Ixhu2wKTjPgjYJiG-NJBchyDKJuYBKY5i-TpT8rc1ItuFvipuiSK0VWA6ILUzKiPYfSPxByHp3NuXTkwNphykJzoHzWtRed3IPYxrsCTvHxdA1PuVo65JxnnDeXi2By76mHYmNUnJSns7l206BH6vQ4JgFlrRf3MBHAY-cMCgpdNbg7eTYggFcfQCTAKJSS9U4mZB6M1M5KUbwusR1_PnDm99i_L9-merHOz9Nj2pbIv0SQhjR8APT7s',
    timestamp: '09:41 AM',
    text: "Hey everyone, I'm trying to optimize a pandas DataFrame merge operation. Currently it's taking about 45 seconds for 2M rows. Any tips on speeding this up?",
    threadCount: 0
  },
  {
    id: '2',
    type: 'code',
    authorName: 'sarah_data',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARKDV41ZBf-aTsGxRenhhA_ieAU5UFwkQfnUdSkZeeI80IaM8AjiNw3hwPC9jjUs2sH_ABbZwtVxU9qKQPxAZ0Gv7602DF8mMty5vXlPxQISLFuHQNjdWLnv-DzbJeFiLaG6y_wv9Aesz5h7NDJk6aav2Faq5OEH4vpdJnS-D8GemCd_GLp3hmFTOHEZrk7ECW6ClbCp4iv_grzRsHHKp3ulrlc_lgx-iWldQdEqy_4lWNByO2xb3u2kzf8sSt8vUIUoYF7uhxEWx5',
    timestamp: '09:44 AM',
    text: "Are you merging on an index or columns? Also, check if your datatypes are optimized before the merge. Sometimes casting float64 to float32 or using categorical types saves a lot of time. Here's a quick helper function I use to downcast:",
    payload: {
      language: 'python',
      code: `def reduce_mem_usage(df):
    start_mem = df.memory_usage().sum() / 1024**2
    for col in df.columns:
        col_type = df[col].dtype
        if col_type != 'object':
            c_min = df[col].min()
            c_max = df[col].max()
            # Add type casting logic here
    return df`
    },
    threadCount: 0
  },
  {
    id: '3',
    type: 'file',
    authorName: 'alex_dev',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMAKARsA0W1dfMwwDFdB2UfihJdHHso2WUx1dfDOJm-06KI_I0_DhFPc7gmunuZlnaeFht1f6vb49h4ScBY8UaXZdxCM6issNBbBsIoV_PBvDg_ZyktOzzoJzyyhDK1lE3wdy8P-QXLjQcp8TVTkm3Ym77_bRNAttSwJ7emIQKcySs6OB5i2N4ZJY2eLQKjALitWmACH4zO9Hr5qdAMuuouNQRQDKNI7SpKu6B8fTIdHndXmQGwQQ46c0k3pUaroXbYA9WOsLPM8sQ',
    timestamp: '09:50 AM',
    text: "That makes sense. Here is a sample of the data structure I'm working with before the merge.",
    payload: {
      fileName: 'sales_data_sample_v2.csv',
      fileSize: '4.2 MB',
      fileType: 'CSV'
    },
    threadCount: 3,
    lastReplyAt: '10:15 AM',
    threadParticipants: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB9DsazzfWOSBG1uXZi_0NeLLbsAG4bIO3jUGv5x5IB9DW4i9Jw5w9GPFY176N484M-70TR16qrBXh8LQrngEJhcvARHASHIKTtHEwrTKuSRezGG9SJH5pruJBDNhahzAlpL8u97bbstNrU0u_T9KA-sP9VGBjlQ2BecV0tMG1IZaCNv2I53Ztv8K7ZQxfSAmZDw5DJQhxRpsbzb7JqVIc9SpqVQ8HoqLPRtNzRMlUsxrL_pH3VuohAOmwP2Gn2SgO4VHcYvscj_E8n',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAGojoy0DuwNAf0qlubpK8T_VDJ-OXTKe1d_yQunu9dIbzLIMA9QO6jdiw-Y3pD0E58JEygLR4OhJuQWKSot1gGcCWapjwQM8VDWlq3dayxsUWTIFpJqkqf_I4KVCdaoAKQQXBifvt6Nr1ULnkn0LcNFoNPer5-s4oRDBFXOVCHb027mLYxLa0xJQFwAhKrohnRBeoIn1JgATfXfQBk26a-Ke4mlEMwmONqs6DS-WuDz76xaywzHUYbf1QGVu23KiWYflN_46NT7BCY'
    ]
  }
];

export default function ChannelView() {
  const { channelId } = useParams();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);

  const handleNewMessage = (msg) => {
    setMessages(prev => [...prev, msg]);
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-64px)] relative">
      <div className="flex items-center justify-between px-8 py-6 sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="font-headline-lg text-headline-lg text-on-background flex items-center gap-2">
              <span className="text-primary-fixed">#</span>{channelId || 'python-help'}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex -space-x-2">
                <img className="w-6 h-6 rounded-full border border-surface-container object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQED614lkvQ_aaxJErJGIKKMKASdSfPvQTc70v2Mm-JFiket8nehfSe_60IuoU6H0xHUKlutBd0N8ZA4ubX_3hhK3_sBM0wUfk3Aq679b0EOnuLY65-BgK1z9vrWTF3wRj8UMeQx8J1r7klrNuHUA--9mODtHtCCDTeQFSopTCzEgnV210NqHs5IVay74LtpnkqdtLoC4imrf1zvetS4J71fMb2hHbAPDAPqwZ88_ZL2jDaBSEnDKiLwvp8nuCnd3f4I4sL6zX_vuV" alt="avatar" />
                <img className="w-6 h-6 rounded-full border border-surface-container object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYTh0qc9-tiAjH2RLBqYg94uWe9YMRVZLRwWd12PMeJwkdl5K4Cv_dmetkzKrkv5i_t1hRzRi4zhO88TDF0F0o_XcffTtIIsaFKgnIAZT0vblaWynr5Ug09Z7BQ3x93xpIDTyWwSajnjJOFsY0DfkprdvlDxnCZob5KMxpy2GR3782s1bpmRrQUWXkshoNHdPefhNgdFt-hvmM5JcL54FPjYc0s88cb-TD9X9j7WPekK3ewTIoY8YMKAy6cstycCBWOF81LiO3pDui" alt="avatar" />
                <img className="w-6 h-6 rounded-full border border-surface-container object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD839fXHRhH_KhnGk7YzDyDZDqEhg37Vr0z1z6-BVhfTssvrieMkbA2wm5_jBGaOx2hq41REGlB-mi4ZNyhqOcNuuC7FRLrlp7ZJnR7DYtM11GxFE1wI36G0jr3ugPZOmnv2zrFv0IAkcXRDwklfuCWbh0TYK1ldIq5JuuLc0emUydRoLIjmkUFNER1vwXZsafxSMPbZL6-grDv2DTkOvuyFc5EN2rvU0jnm4xxqLJ7oPkiRuA8qdbp95WyyeRgkcTCVT7LR-NvIRWq" alt="avatar" />
              </div>
              <span className="font-mono-sm text-mono-sm text-on-surface-variant">1,204 members</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="font-mono-sm text-mono-sm text-primary-fixed flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse"></span>
                14 active
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors group">
            <span className="material-symbols-outlined text-[20px] group-hover:text-primary-fixed transition-colors">push_pin</span>
          </button>
          <button className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors group">
            <span className="material-symbols-outlined text-[20px] group-hover:text-primary-fixed transition-colors">folder</span>
          </button>
        </div>
      </div>

      <ChatArea messages={messages} />
      <MessageInput channelId={channelId} onMessageSent={handleNewMessage} />
    </div>
  );
}
