export interface GameCatalogItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: "tile" | "flashcards" | "planned";
}

export const GAME_CATALOG: GameCatalogItem[] = [
  { id: "team-quiz", title: "Ô Số Đồng Đội", description: "Chọn bộ câu hỏi, mở ô số và cùng các đội ghi điểm.", icon: "🧩", status: "tile" },
  { id: "random-picker", title: "Gọi tên ngẫu nhiên", description: "Chọn tên ngẫu nhiên cho hoạt động lớp học.", icon: "🎡", status: "planned" },
  { id: "tug-of-war", title: "Kéo co – Đua thuyền kiến thức", description: "Hai đội thi trả lời câu hỏi.", icon: "🚣", status: "planned" },
  { id: "head-tilt", title: "Quiz nghiêng đầu", description: "Chọn đáp án bằng cách nghiêng đầu.", icon: "🙂", status: "planned" },
  { id: "fruit-bubbles", title: "Chém hoa quả – Bắt bong bóng", description: "Chọn đáp án qua trò chơi tương tác.", icon: "🍉", status: "planned" },
  { id: "star-race", title: "Cuộc đua ngôi sao", description: "Thi trả lời câu hỏi để giành sao.", icon: "⭐", status: "planned" },
  { id: "mines", title: "Dò mìn", description: "Chọn đáp án và tránh ô có mìn.", icon: "💣", status: "planned" },
  { id: "zombies", title: "Chặn Zombie", description: "Trả lời câu hỏi để bảo vệ hàng rào.", icon: "🧟", status: "planned" },
  { id: "exercise-abc", title: "Thể dục ABC", description: "Vừa vận động vừa trả lời câu hỏi.", icon: "🤸", status: "planned" },
  { id: "puzzle-reveal", title: "Trò chơi lật mảnh ghép", description: "Trả lời câu hỏi để mở bức tranh.", icon: "🖼️", status: "planned" },
  { id: "knowledge-train", title: "Đoàn tàu tri thức", description: "Sắp xếp các toa tàu theo đáp án.", icon: "🚂", status: "planned" },
  { id: "turn-game", title: "Game theo lượt", description: "Tung xúc xắc và vượt thử thách theo lượt.", icon: "🎲", status: "planned" },
  { id: "duel", title: "Game đối kháng", description: "Hai người chơi cùng thi trả lời.", icon: "⚔️", status: "planned" },
  { id: "paper-mode", title: "Chế độ giấy", description: "Trả lời trắc nghiệm bằng thẻ giấy.", icon: "📄", status: "planned" },
  { id: "rhythm-quiz", title: "Trắc nghiệm theo nhịp độ", description: "Trò chơi câu hỏi theo nhịp độ lớp học.", icon: "⏱️", status: "planned" },
  { id: "flying-words", title: "Từ ngữ biết bay", description: "Chọn và sắp xếp từ thành câu.", icon: "🔤", status: "planned" },
  { id: "matching", title: "Kéo thả nối ý", description: "Ghép các ý tương ứng với nhau.", icon: "🧷", status: "planned" },
  { id: "crossword", title: "Ô chữ khóa bí mật", description: "Giải câu hỏi để khám phá ô chữ.", icon: "🔠", status: "planned" },
  { id: "flashcards", title: "Thẻ lật tiếng Anh", description: "Học từ tiếng Anh bằng thẻ lật có sẵn.", icon: "🃏", status: "flashcards" },
  { id: "mind-map", title: "Sơ đồ tư duy", description: "Sắp xếp và ôn tập ý chính của bài học.", icon: "💡", status: "planned" },
  { id: "gallery", title: "Phòng tranh 3D", description: "Khám phá tranh trong không gian 3D.", icon: "🎨", status: "planned" },
  { id: "interactive-video", title: "Video tương tác", description: "Học cùng video và câu hỏi.", icon: "🎬", status: "planned" },
  { id: "interactive-image", title: "Ảnh tương tác", description: "Khám phá hình ảnh và câu hỏi.", icon: "🖼️", status: "planned" },
  { id: "learning-journey", title: "Hành trình học tập", description: "Vượt qua các chặng học tập.", icon: "🗺️", status: "planned" },
  { id: "treasure-hunt", title: "Săn kho báu", description: "Giải câu hỏi để tìm kho báu.", icon: "💎", status: "planned" },
  { id: "custom-game", title: "Game tự tạo", description: "Tạo trò chơi riêng cho lớp học.", icon: "🎮", status: "planned" },
  { id: "sleeping-dragon", title: "Rồng ngủ – Quản lý lớp", description: "Hoạt động hỗ trợ quản lý lớp học.", icon: "🐉", status: "planned" },
  { id: "timer", title: "Đồng hồ đếm ngược", description: "Đồng hồ cho các hoạt động trên lớp.", icon: "⏳", status: "planned" },
];
