/* ЕДИНАЯ КОНФИГУРАЦИЯ. Редактируйте только этот файл, чтобы менять тексты и фотографии. */
const siteConfig = {
  projectTitle: "Первокурсник в лицах",   // временное название — меняется здесь
  eventName: "День первокурсника",
  dateLabel: "22 октября 2026",
  dateISO: "2026-10-22",
  photographer: "Фотограф Салиев Пехруз Бахадурович",
  description: "Авторский фоторепортаж с городского Дня первокурсника. Описание события появится здесь.",
  filePrefix: "pervokursnik-v-licah"       // префикс имён скачиваемых файлов
};

/* Фотографии. Чтобы добавить кадр, скопируйте строку и поменяйте номер и файлы.
   Если файла нет, сайт покажет заглушку. */
const photos = [
  { id: "photo-01", number: "01", title: "Вихрь", caption: "Танцовщица в длинной выдержке", alt: "Танцовщица в белой юбке в движении на тёмной сцене", edited: "assets/photos/edited/01.jpg", original: "assets/photos/original/01.arw", focus: "75% 50%" },
  { id: "photo-02", number: "02", title: "За кулисами", caption: "Смех у занавеса", alt: "Девушка и молодой человек у занавеса, у неё в руках телефоны", edited: "assets/photos/edited/02.jpg", original: "assets/photos/original/02.arw" },
  { id: "photo-03", number: "03", title: "Улыбка", caption: "Портрет с росписью на лице", alt: "Улыбающаяся девушка с белым узором на лице", edited: "assets/photos/edited/03.jpg", original: "assets/photos/original/03.arw" },
  { id: "photo-04", number: "04", title: "Полёт", caption: "Хореография, отборочный тур", alt: "Танцовщица с раскинутыми руками на фоне экрана", edited: "assets/photos/edited/04.jpg", original: "assets/photos/original/04.arw" },
  { id: "photo-05", number: "05", title: "Костюмы", caption: "Пара в праздничных нарядах", alt: "Девушка и юноша в праздничных костюмах на фоне выставки фотографий", edited: "assets/photos/edited/05.jpg", original: "assets/photos/original/05.arw" },
  { id: "photo-06", number: "06", title: "Объятие", caption: "Танцевальная пара на сцене", alt: "Танцевальная пара в белых рубашках, девушка склонила голову на плечо партнёра", edited: "assets/photos/edited/06.jpg", original: "assets/photos/original/06.arw" },
  { id: "photo-07", number: "07", title: "Отражения", caption: "Портрет через стекло", alt: "Молодой человек за стеклом, в котором отражается зал", edited: "assets/photos/edited/07.jpg", original: "assets/photos/original/07.arw" },
  { id: "photo-08", number: "08", title: "Кружение", caption: "Белая вуаль в движении", alt: "Размытая в движении танцовщица в белом наряде и головном уборе", edited: "assets/photos/edited/08.jpg", original: "assets/photos/original/08.arw" },
  { id: "photo-09", number: "09", title: "Просмотр кадров", caption: "Двое на ступенях с камерой", alt: "Двое в тёмной форме сидят на ступенях и разглядывают снимки на камере", edited: "assets/photos/edited/09.jpg", original: "assets/photos/original/09.arw" },
  { id: "photo-10", number: "10", title: "Дом", caption: "Сценическая композиция", alt: "Четверо участников держат деревянные жерди в форме дома", edited: "assets/photos/edited/10.jpg", original: "assets/photos/original/10.arw" }
];
