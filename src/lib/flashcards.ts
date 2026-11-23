export interface Flashcard {
  english: string;
  vietnamese: string;
  picture: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  icon: string;
  cards: Flashcard[];
}

export const FLASHCARD_DECKS: FlashcardDeck[] = [
  {
    id: "animals", title: "Con vật", icon: "🐾",
    cards: [
      { english: "cat", vietnamese: "con mèo", picture: "🐱" },
      { english: "dog", vietnamese: "con chó", picture: "🐶" },
      { english: "bird", vietnamese: "con chim", picture: "🐦" },
      { english: "fish", vietnamese: "con cá", picture: "🐟" },
      { english: "rabbit", vietnamese: "con thỏ", picture: "🐰" },
      { english: "elephant", vietnamese: "con voi", picture: "🐘" },
      { english: "monkey", vietnamese: "con khỉ", picture: "🐵" },
      { english: "tiger", vietnamese: "con hổ", picture: "🐯" },
    ],
  },
  {
    id: "fruits", title: "Trái cây", icon: "🍎",
    cards: [
      { english: "apple", vietnamese: "quả táo", picture: "🍎" },
      { english: "banana", vietnamese: "quả chuối", picture: "🍌" },
      { english: "orange", vietnamese: "quả cam", picture: "🍊" },
      { english: "grapes", vietnamese: "quả nho", picture: "🍇" },
      { english: "strawberry", vietnamese: "quả dâu tây", picture: "🍓" },
      { english: "watermelon", vietnamese: "quả dưa hấu", picture: "🍉" },
      { english: "pineapple", vietnamese: "quả dứa", picture: "🍍" },
      { english: "lemon", vietnamese: "quả chanh vàng", picture: "🍋" },
    ],
  },
  {
    id: "colors", title: "Màu sắc", icon: "🌈",
    cards: [
      { english: "red", vietnamese: "màu đỏ", picture: "🔴" },
      { english: "blue", vietnamese: "màu xanh dương", picture: "🔵" },
      { english: "yellow", vietnamese: "màu vàng", picture: "🟡" },
      { english: "green", vietnamese: "màu xanh lá", picture: "🟢" },
      { english: "orange", vietnamese: "màu cam", picture: "🟠" },
      { english: "purple", vietnamese: "màu tím", picture: "🟣" },
      { english: "black", vietnamese: "màu đen", picture: "⚫" },
      { english: "white", vietnamese: "màu trắng", picture: "⚪" },
    ],
  },
  {
    id: "numbers", title: "Số đếm", icon: "🔢",
    cards: [
      { english: "one", vietnamese: "số một", picture: "1️⃣" },
      { english: "two", vietnamese: "số hai", picture: "2️⃣" },
      { english: "three", vietnamese: "số ba", picture: "3️⃣" },
      { english: "four", vietnamese: "số bốn", picture: "4️⃣" },
      { english: "five", vietnamese: "số năm", picture: "5️⃣" },
      { english: "six", vietnamese: "số sáu", picture: "6️⃣" },
      { english: "seven", vietnamese: "số bảy", picture: "7️⃣" },
      { english: "eight", vietnamese: "số tám", picture: "8️⃣" },
      { english: "nine", vietnamese: "số chín", picture: "9️⃣" },
      { english: "ten", vietnamese: "số mười", picture: "🔟" },
    ],
  },
];
