import React, { useState, useEffect } from 'react';
import { 
  Calendar, BookOpen, Users, Home, Clock, MapPin, 
  User, Plus, Trash2, Edit, Lock, LogOut, X, Save,
  Download, Smartphone, HelpCircle, Share2, Copy, Loader2
} from 'lucide-react';

// --- IMPORT FIREBASE ---
// Pastikan Anda sudah install: npm install firebase
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, 
  doc, onSnapshot, query, orderBy 
} from "firebase/firestore";

// --- KONFIGURASI FIREBASE ---
// 1. Buka console.firebase.google.com
// 2. Buat Project Baru -> Pilih Web (icon </> )
// 3. Copy "firebaseConfig" Anda dan PASTE di bawah ini menggantikan area yang saya tandai:
const firebaseConfig = {
  apiKey: "AIzaSyAa1lp3K7z5k-IPvx0YPtzhr1vPk9ouHtg",
  authDomain: "info-masjid-albarkah.firebaseapp.com",
  projectId: "info-masjid-albarkah",
  storageBucket: "info-masjid-albarkah.firebasestorage.app",
  messagingSenderId: "520006889582",
  appId: "1:520006889582:web:08ba9c0368c000604ff67f"
};

// Inisialisasi Database (Cek agar tidak error saat config belum diisi)
let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.log("Firebase belum disetting atau config salah.");
}

// --- KONFIGURASI ADMIN ---
const ADMIN_PIN = 'Albarkah2026'; 
const ADMIN_WA = '6285137666570'; 

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  // Loading State
  const [loading, setLoading] = useState(true);

  // Data State (Kosongkan awal, karena akan diisi dari Database)
  const [fridayData, setFridayData] = useState([]);
  const [studyData, setStudyData] = useState([]);
  const [activityData, setActivityData] = useState([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [editingItem, setEditingItem] = useState(null); 
  const [formData, setFormData] = useState({});

  // --- 1. MEMBACA DATA DARI DATABASE (REALTIME) ---
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    // Ambil Data Jumat
    const qJumat = query(collection(db, "jumat"), orderBy("date", "asc"));
    const unsubJumat = onSnapshot(qJumat, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFridayData(data);
      setLoading(false);
    });

    // Ambil Data Kajian
    const qKajian = query(collection(db, "kajian"), orderBy("day", "desc"));
    const unsubKajian = onSnapshot(qKajian, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudyData(data);
    });

    // Ambil Data Kegiatan
    const qKegiatan = query(collection(db, "kegiatan"), orderBy("date", "asc"));
    const unsubKegiatan = onSnapshot(qKegiatan, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActivityData(data);
    });

    // Bersihkan listener saat aplikasi ditutup
    return () => {
      unsubJumat();
      unsubKajian();
      unsubKegiatan();
    };
  }, []);

  // --- LOGIC AUTH ADMIN ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAdmin(true);
      setShowLogin(false);
      setPinInput('');
    } else {
      alert('PIN Salah! Silakan coba lagi.');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    alert('Anda telah keluar dari mode Admin');
  };

  // --- LOGIC CRUD KE DATABASE ---
  
  // 1. Delete (Hapus dari Firebase)
  const handleDelete = async (type, id) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;
    try {
      await deleteDoc(doc(db, type, id)); // type harus sama dengan nama koleksi (jumat/kajian/kegiatan)
    } catch (e) {
      alert("Gagal menghapus: " + e.message);
    }
  };

  // 2. Open Modal
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setShowModal(true);
    setFormData(item ? { ...item } : {});
  };

  // 3. Save Data (Simpan ke Firebase)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!db) return alert("Database belum terhubung! Cek file App.jsx");

    const collectionName = modalType; // jumat, kajian, atau kegiatan

    try {
      if (editingItem) {
        // UPDATE Data Lama
        const docRef = doc(db, collectionName, editingItem.id);
        await updateDoc(docRef, formData);
      } else {
        // TAMBAH Data Baru
        await addDoc(collection(db, collectionName), formData);
      }
      setShowModal(false);
    } catch (e) {
      alert("Gagal menyimpan: " + e.message);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- LOGIC SHARE (Sama seperti sebelumnya) ---
  const generateShareText = () => {
    const nextFriday = fridayData.length > 0 ? fridayData[0] : null;
    const nextKajian = studyData.length > 0 ? studyData[0] : null;
    const url = window.location.href; 

    let text = `*🕌 Info Masjid Jami Albarkah 🕌*\nJl. Gegerkalong Hilir No.112 B\n\n`;
    text += `Assalamu'alaikum, berikut jadwal kegiatan masjid terkini:\n\n`;

    if (nextFriday) {
      text += `*🗓️ Jumat, ${nextFriday.date}*\n`;
      text += `👤 Khotib: ${nextFriday.khotib}\n`;
      text += `🎤 Muadzin: ${nextFriday.muadzin}\n\n`;
    }

    if (nextKajian) {
      text += `*📚 Kajian Terdekat*\n`;
      text += `📖 Materi: ${nextKajian.title}\n`;
      text += `👳 Pemateri: ${nextKajian.speaker}\n`;
      text += `⏰ Waktu: ${nextKajian.day}, ${nextKajian.time}\n\n`;
    }

    text += `📲 *Lihat jadwal lengkap & install aplikasi:* \n${url}`;
    return text;
  };

  const handleShareWA = () => {
    const text = generateShareText();
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyLink = () => {
    const text = generateShareText();
    navigator.clipboard.writeText(text);
    alert('Teks berhasil disalin!');
  };

  // --- COMPONENTS (UI) ---
  // (UI relatif sama, hanya ditambah Loading State)

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 px-2 shadow-lg z-40 max-w-md mx-auto">
      {['home', 'jumat', 'kajian', 'kegiatan'].map((tab) => (
        <button key={tab} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center ${activeTab === tab ? 'text-emerald-600' : 'text-gray-400'}`}>
          {tab === 'home' && <Home size={24} />}
          {tab === 'jumat' && <Calendar size={24} />}
          {tab === 'kajian' && <BookOpen size={24} />}
          {tab === 'kegiatan' && <Users size={24} />}
          <span className="text-[10px] mt-1 font-medium capitalize">{tab}</span>
        </button>
      ))}
    </div>
  );

  const AdminButton = () => (
    <div className="absolute top-6 right-6 z-10 flex gap-2">
      <button onClick={() => setShowShare(true)} className="bg-white/20 backdrop-blur text-white p-2 rounded-full border border-white/30 hover:bg-white/30 transition">
        <Share2 size={16} />
      </button>
      <button onClick={() => setShowInstall(true)} className="bg-white/20 backdrop-blur text-white p-2 rounded-full border border-white/30 hover:bg-white/30 transition">
        <Download size={16} />
      </button>
      {isAdmin ? (
        <button onClick={handleLogout} className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition"><LogOut size={16} /></button>
      ) : (
        <button onClick={() => setShowLogin(true)} className="bg-white/20 backdrop-blur text-white p-2 rounded-full border border-white/30 hover:bg-white/30 transition"><Lock size={16} /></button>
      )}
    </div>
  );

  const FabAdd = ({ type }) => isAdmin && (
    <button onClick={() => openModal(type)} className="fixed bottom-20 right-5 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition z-40"><Plus size={24} /></button>
  );

  const AdminControls = ({ type, item }) => isAdmin && (
    <div className="flex gap-2 ml-2">
      <button onClick={() => openModal(type, item)} className="p-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"><Edit size={16} /></button>
      <button onClick={() => handleDelete(type, item.id)} className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><Trash2 size={16} /></button>
    </div>
  );

  // --- VIEWS ---

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

  const HomeView = () => (
    <div className="space-y-6 pb-24 relative">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-6 rounded-b-3xl shadow-md relative">
        <AdminButton />
        <h1 className="text-2xl font-bold pr-28">Masjid Jami Albarkah</h1>
        <p className="text-emerald-100 text-sm mt-1">Jl. Gegerkalong Hilir No.112 B</p>
        <div className="mt-6 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
          <div className="flex justify-between items-center mb-2"><span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Jadwal Sholat</span><Clock size={16} className="text-emerald-100" /></div>
          <div className="text-3xl font-bold">Ashar</div><div className="text-lg">15:15 WIB</div>
        </div>
        {isAdmin && <div className="mt-4 bg-yellow-500/20 border border-yellow-200/50 p-2 rounded-lg text-center text-xs font-bold text-yellow-100">MODE ADMIN AKTIF</div>}
      </div>
      <div className="px-5">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Info Terkini</h2>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 cursor-pointer hover:shadow-md transition" onClick={() => setActiveTab('jumat')}>
          <div className="flex items-center gap-3 mb-2"><div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><User size={20} /></div><span className="font-semibold text-gray-700">Khotib Berikutnya</span></div>
          <p className="text-gray-600 text-sm pl-12 line-clamp-1 font-medium">{fridayData.length > 0 ? fridayData[0].khotib : 'Belum ada data'}</p>
          {fridayData.length > 0 && <div className="flex gap-2 pl-12 mt-1 text-xs text-gray-400"><Calendar size={12} className="mt-0.5" /><span>{fridayData[0].date}</span></div>}
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 cursor-pointer hover:shadow-md transition" onClick={() => setActiveTab('kajian')}>
          <div className="flex items-center gap-3 mb-2"><div className="bg-blue-100 p-2 rounded-lg text-blue-600"><BookOpen size={20} /></div><span className="font-semibold text-gray-700">Kajian Terkini</span></div>
          <p className="text-gray-600 text-sm pl-12 font-medium line-clamp-1">{studyData.length > 0 ? studyData[0].title : 'Belum ada kajian'}</p>
          {studyData.length > 0 && <div className="flex gap-2 pl-12 mt-1 text-xs text-gray-400"><span>{studyData[0].day}</span> • <span>{studyData[0].time}</span></div>}
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 cursor-pointer hover:shadow-md transition" onClick={() => setActiveTab('kegiatan')}>
          <div className="flex items-center gap-3 mb-2"><div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Users size={20} /></div><span className="font-semibold text-gray-700">Kegiatan Masjid</span></div>
          <p className="text-gray-600 text-sm pl-12 font-medium line-clamp-1">{activityData.length > 0 ? activityData[0].name : 'Belum ada kegiatan'}</p>
          {activityData.length > 0 && <div className="flex gap-2 pl-12 mt-1 text-xs text-gray-400"><span>{activityData[0].date}</span></div>}
        </div>
      </div>
    </div>
  );

  const FridayView = () => (
    <div className="px-5 pt-6 pb-24 min-h-screen">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Calendar className="text-emerald-600" /> Jadwal Jumat</h2>
      <div className="space-y-4">
        {fridayData.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3 border-b border-dashed border-gray-200 pb-3"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">{item.date}</span><AdminControls type="jumat" item={item} /></div>
            <div className="space-y-2"><div><span className="text-xs text-gray-400 uppercase">Khotib</span><p className="font-semibold">{item.khotib}</p></div><div className="flex justify-between pt-2"><div><span className="text-xs text-gray-400 uppercase">Imam</span><p className="text-sm">{item.imam}</p></div><div className="text-right"><span className="text-xs text-gray-400 uppercase">Muadzin</span><p className="text-sm">{item.muadzin}</p></div></div></div>
          </div>
        ))}
        {fridayData.length === 0 && <p className="text-center text-gray-400 py-10">Belum ada jadwal.</p>}
      </div>
      <FabAdd type="jumat" />
    </div>
  );

  const StudyView = () => (
    <div className="px-5 pt-6 pb-24 min-h-screen">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><BookOpen className="text-emerald-600" /> Kajian Rutin</h2>
      <div className="space-y-4">
        {studyData.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="bg-blue-50 px-5 py-3 flex justify-between items-center"><span className="font-bold text-blue-800">{item.day}</span><div className="flex items-center"><span className="text-xs font-medium bg-white text-blue-600 px-2 py-1 rounded border border-blue-100 mr-2">{item.time}</span><AdminControls type="kajian" item={item} /></div></div>
            <div className="p-5"><h3 className="text-lg font-bold text-gray-800 mb-1">{item.title}</h3><div className="flex items-center gap-2 text-gray-600 text-sm mt-2"><User size={14} /> <span>{item.speaker}</span></div></div>
          </div>
        ))}
        {studyData.length === 0 && <p className="text-center text-gray-400 py-10">Belum ada kajian.</p>}
      </div>
      <FabAdd type="kajian" />
    </div>
  );

  const ActivitiesView = () => (
    <div className="px-5 pt-6 pb-24 min-h-screen">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Users className="text-emerald-600" /> Kegiatan Masjid</h2>
      <div className="space-y-5">
        {activityData.map((item) => (
          <div key={item.id} className="relative bg-white rounded-xl shadow-sm border border-gray-100 p-5 pl-6">
            <div className="absolute left-0 top-5 bottom-5 w-1.5 bg-orange-400 rounded-r-lg"></div>
            <div className="flex justify-between items-start mb-2"><h3 className="text-lg font-bold text-gray-800">{item.name}</h3><AdminControls type="kegiatan" item={item} /></div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3"><span className="flex items-center gap-1"><Calendar size={12}/> {item.date}</span><span className="flex items-center gap-1"><Clock size={12}/> {item.time}</span></div>
            <p className="text-sm text-gray-600 mb-4">{item.desc}</p>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-3 py-1.5 rounded-lg"><MapPin size={12} /> {item.location}</div>
          </div>
        ))}
        {activityData.length === 0 && <p className="text-center text-gray-400 py-10">Belum ada kegiatan.</p>}
      </div>
      <FabAdd type="kegiatan" />
    </div>
  );

  // --- MODALS (Login, Install, Share, Form) ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      <div className="min-h-screen bg-gray-50">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'jumat' && <FridayView />}
        {activeTab === 'kajian' && <StudyView />}
        {activeTab === 'kegiatan' && <ActivitiesView />}
      </div>
      <BottomNav />

      {/* Modal Login Admin */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-xs shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-center">Login Admin</h3>
            <form onSubmit={handleLogin}>
              <input type="password" placeholder="Masukkan PIN" className="w-full p-3 border border-gray-300 rounded-xl mb-4 text-center text-lg tracking-widest outline-emerald-500" value={pinInput} onChange={(e) => setPinInput(e.target.value)} autoFocus />
              <div className="flex gap-2 mb-4"><button type="button" onClick={() => setShowLogin(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Batal</button><button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700">Masuk</button></div>
              <div className="text-center pt-2 border-t border-gray-100"><a href={`https://wa.me/${ADMIN_WA}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600"><HelpCircle size={12} /> Lupa PIN? Hubungi Admin</a></div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Form CRUD */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-6 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold capitalize">{editingItem ? 'Edit' : 'Tambah'} {modalType}</h3><button onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <form onSubmit={handleSave} className="space-y-4">
              {modalType === 'jumat' && (
                <>
                  <div><label className="text-xs font-bold text-gray-500">Tanggal</label><input name="date" required placeholder="Contoh: 29 Des 2023" defaultValue={formData.date} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl" /></div>
                  <div><label className="text-xs font-bold text-gray-500">Khotib</label><input name="khotib" required defaultValue={formData.khotib} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl" /></div>
                  <div><label className="text-xs font-bold text-gray-500">Imam</label><input name="imam" required defaultValue={formData.imam} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl" /></div>
                  <div><label className="text-xs font-bold text-gray-500">Muadzin</label><input name="muadzin" required defaultValue={formData.muadzin} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl" /></div>
                </>
              )}
              {modalType === 'kajian' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-bold text-gray-500">Hari</label><input name="day" required defaultValue={formData.day} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl" /></div>
                    <div><label className="text-xs font-bold text-gray-500">Waktu</label><input name="time" required defaultValue={formData.time} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl" /></div>
                  </div>
                  <div><label className="text-xs font-bold text-gray-500">Judul</label><input name="title" required defaultValue={formData.title} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl" /></div>
                  <div><label className="text-xs font-bold text-gray-500">Pemateri</label><input name="speaker" required defaultValue={formData.speaker} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl" /></div>
                </>
              )}
              {modalType === 'kegiatan' && (
                <>
                  <div><label className="text-xs font-bold text-gray-500">Nama</label><input name="name" required defaultValue={formData.name} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-bold text-gray-500">Tanggal</label><input name="date" required defaultValue={formData.date} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl" /></div>
                    <div><label className="text-xs font-bold text-gray-500">Jam</label><input name="time" required defaultValue={formData.time} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl" /></div>
                  </div>
                  <div><label className="text-xs font-bold text-gray-500">Lokasi</label><input name="location" required defaultValue={formData.location} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl" /></div>
                  <div><label className="text-xs font-bold text-gray-500">Deskripsi</label><textarea name="desc" required defaultValue={formData.desc} onChange={handleInputChange} className="w-full p-3 bg-gray-50 rounded-xl h-24" /></div>
                </>
              )}
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 mt-4"><Save size={18} /> Simpan Data</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Share & Install - (Logic sama, disingkat agar file tidak terlalu panjang) */}
      {showShare && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowShare(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center"><h3 className="font-bold flex gap-2"><Share2 size={18}/> Bagikan</h3><button onClick={() => setShowShare(false)}><X size={20} /></button></div>
            <div className="p-6 space-y-3">
              <div className="bg-gray-50 p-4 rounded-xl text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">{generateShareText()}</div>
              <button onClick={handleShareWA} className="w-full py-3 bg-[#25D366] text-white font-bold rounded-xl">WhatsApp</button>
              <button onClick={handleCopyLink} className="w-full py-3 bg-white border border-gray-300 rounded-xl">Salin</button>
            </div>
          </div>
        </div>
      )}

      {showInstall && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowInstall(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm text-center" onClick={e => e.stopPropagation()}>
             <h3 className="text-xl font-bold mb-2">Install Aplikasi</h3>
             <p className="text-sm text-gray-500 mb-4">Gunakan Chrome (Android) atau Safari (iOS) lalu pilih "Add to Home Screen".</p>
             <button onClick={() => setShowInstall(false)} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;