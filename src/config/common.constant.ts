import { CryptoCurrency } from '~/interface';

export const IMAGE_URLS: string[] = [
  'https://images.unsplash.com/photo-1572782992110-afab5a6ef870?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
  'https://images.unsplash.com/photo-1550527882-b71dea5f8089?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1562770584-eaf50b017307?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1602&q=80',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80',
  'https://images.unsplash.com/photo-1584045446619-7146285c9811?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
  'https://images.unsplash.com/photo-1623241468000-e688e8ff4e02?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80',
  'https://images.unsplash.com/photo-1553386323-60698d6f7325?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1632849369576-06cb097fe68f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1473&q=80',
  'https://images.unsplash.com/photo-1590393654513-897773df2125?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1060&q=80',
  'https://images.unsplash.com/photo-1584985429926-08867327d3a6?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=688&q=80',
  'https://images.unsplash.com/photo-1564691038808-85233054b622?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
  'https://images.unsplash.com/photo-1633158829799-96bb13cab779?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1570053925584-b01273e1d656?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1564690765900-a5f34b01ca88?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
  'https://images.unsplash.com/photo-1572019356778-10ea6db2474f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80',
  'https://images.unsplash.com/photo-1609587415882-97552f39c6c2?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=627&q=80',
  'https://images.unsplash.com/photo-1619634912816-8e6ab3b7d176?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=580&q=80',
  'https://images.unsplash.com/photo-1627923605750-d1b949006f96?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
];

export const IMAGE_GOLD_URLS: string[] = [
  'https://images.unsplash.com/photo-1610375461246-83df859d849d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80',
  'https://images.unsplash.com/photo-1520473378652-85d9c4aee6cf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=987&q=80',
  'https://plus.unsplash.com/premium_photo-1678766103248-d83b98ac3531?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=987&q=80',
  'https://images.unsplash.com/photo-1598561222812-63429c3eee2f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1480&q=80',
  'https://images.unsplash.com/photo-1542438927-433fdaaec56a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=989&q=80',
  'https://plus.unsplash.com/premium_photo-1678766103137-93329031c17f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=987&q=80',
  'https://images.unsplash.com/photo-1600408987023-15d4ec3a9499?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=998&q=80',
  'https://images.unsplash.com/photo-1543699565-003b8adda5fc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80',
  'https://images.unsplash.com/photo-1599765083545-cca21ebf0ab5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1035&q=80',
  'https://plus.unsplash.com/premium_photo-1678448118499-7db2fe2efdc5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1384&q=80',
  'https://images.unsplash.com/photo-1622388096719-3310a2b9618e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1035&q=80',
  'https://images.unsplash.com/photo-1624365168898-1f7189831f41?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80',
  'https://images.unsplash.com/photo-1552536273-91084b4b10b4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=927&q=80',
];

export const IMAGE_LOTTO_FAIL_URLS: string[] = [
  'https://images.unsplash.com/photo-1633549446051-82a0599e9e02?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2688&q=80',
  'https://images.unsplash.com/photo-1621410153570-9c55676b0157?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2874&q=80',
  'https://images.unsplash.com/photo-1611890798517-07b0fcb4a811?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2971&q=80',
  'https://images.unsplash.com/photo-1610337673044-720471f83677?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2872&q=80',
  'https://images.unsplash.com/photo-1508935620299-047e0e35fbe3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80',
  'https://images.unsplash.com/photo-1561625984-7474d6927bd9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2739&q=80',
  'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80',
  'https://images.unsplash.com/photo-1578651714116-2a1645b70c0f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2874&q=80',
  'https://images.unsplash.com/photo-1604341841227-6dd5c2255842?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3087&q=80',
  'https://images.unsplash.com/photo-1521075486433-bf4052bb37bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2844&q=80',
  'https://images.unsplash.com/photo-1553465528-5a213ccc0c7b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3098&q=80',
  'https://images.unsplash.com/photo-1517545084371-4a575dde2a02?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3087&q=80',
  'https://images.unsplash.com/photo-1618513623447-d82ae2b7bd87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3055&q=80',
  'https://images.unsplash.com/photo-1590696628300-9d7aad4e4193?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2864&q=80',
  'https://images.unsplash.com/photo-1593194858961-5f1e560b37ce?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80',
  'https://images.unsplash.com/photo-1495699400405-bb4a2de95f60?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2835&q=80',
  'https://images.unsplash.com/photo-1592750584293-e41a7aa21d2b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3087&q=80',
  'https://images.unsplash.com/photo-1434332253042-50df2f9f7b39?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80',
  'https://images.unsplash.com/photo-1527631120902-378417754324?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80',
  'https://images.unsplash.com/photo-1549588167-2350464e784f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80',
];

export const IMAGE_LOTTO_HAPPY_URLS: string[] = [
  'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80',
  'https://images.unsplash.com/photo-1545315003-c5ad6226c272?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2400&q=80',
  'https://images.unsplash.com/photo-1534361960057-19889db9621e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80',
  'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2969&q=80',
  'https://images.unsplash.com/photo-1514845505178-849cebf1a91d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3087&q=80',
  'https://images.unsplash.com/photo-1524293568345-75d62c3664f7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3111&q=80',
  'https://images.unsplash.com/photo-1499081589563-7c400fcd94e8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2971&q=80',
  'https://images.unsplash.com/photo-1567862605632-98ec20c667f7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3046&q=80',
  'https://images.unsplash.com/photo-1569705460033-cfaa4bf9f822?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2837&q=80',
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80',
  'https://images.unsplash.com/photo-1531742903308-ce1ef1631c3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2773&q=80',
  'https://images.unsplash.com/photo-1623604407437-d8fce3bc61de?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2973&q=80',
  'https://images.unsplash.com/photo-1570591798622-e104e02ba28b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2912&q=80',
  'https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80',
  'https://images.unsplash.com/photo-1531686264889-56fdcabd163f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80',
  'https://images.unsplash.com/photo-1576481564650-61d2ed81f6d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2960&q=80',
  'https://images.unsplash.com/photo-1503266980949-bd30d04d0b7a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80',
  'https://images.unsplash.com/photo-1526894198609-10b3cdf45c52?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2944&q=80',
];


export const CONSOLATION: string[] = [
  'ฉันอาจจะไม่เข้าใจเธอ แต่ฉันจะอยู่ข้างๆ เธอนะ 🤍',
  'เธอยังมีเวลาอีกมาก และฉันจะอยู่ข้างๆ เผื่อว่าจะช่วยอะไรเธอได้บ้าง 🤍',
  'เราอยู่ตรงนี้แล้ว มีอะไรระบายมาได้เลย',
  'ใครทำอะไรก็ได้อย่างนั้นแหละ คนแย่ๆ แบบนั้นสักวันก็ต้องได้รับบทเรียน เชื่อเถอะ',
  'วันนี้อาจจะเหนื่อย และมีเรื่องให้ต้องทุกข์ใจเยอะ ตอนนี้เรามาพักสักหน่อยกันเถอะ',
  'มันไม่สายเกินไปหรอกถ้าจะเริ่มต้นใหม่อีกครั้ง',
  'เมื่อไหร่ที่คุณสามารถปล่อยอดีตให้ผ่านไปได้ สิ่งที่ดียิ่งกว่าจะตามมาแน่นอน',
  'ไม่ต้องเสียใจหรอก เพราะเธอทำดีที่สุดแล้ว',
  'เราไม่รู้ว่าวันนี้เธอเจออะไรมา แต่วันนี้เธอยังมีเราอยู่นะ',
  'ช่วงเวลาดีๆ จะกลายเป็นความทรงจำที่ดี และช่วงเวลาแย่ๆ จะกลายเป็นบทเรียนที่ดี',
  'ไม่เป็นไรหรอกนะ หาใหม่ได้ คนดีๆ ยังรอให้เราออกไปเจออีกเยอะ',
  'วันพรุ่งนี้ ทุกอย่างจะต้องดีขึ้นแน่นอน',
  'ค่อยเป็นค่อยไป อย่าเพิ่งคิดอะไรไปไกล อดทนเข้าไว้อาทิตย์ต่อไปจะเป็นยังไงก็ช่าง วันนี้สนใจแค่ว่าอะไรทำให้เรารู้สึกดีขึ้นได้ก็พอ',
  'ถ้าเรารู้จักเรียนรู้จากสิ่งที่เกิดขึ้น มันก็จะช่วยให้เราเลี่ยงที่จะต้องเจอกับคนหรือเหตุการณ์ซ้ำเดิมได้นะ เห็นมั้ยล่ะอย่างน้อยเราก็ไม่ได้เสียเวลาทั้งหมดไปโดยเปล่าประโยชน์',
  'เวลาจะเยียวยาทุกอย่าง เธออาจรู้สึกแย่ โคตรจะแย่ แต่เดี๋ยวมันก็จะผ่านไปเป็นแค่อดีต',
  'ฉันเข้าใจความรู้สึกของเธอนะ ฉันรู้ว่าตอนนี้เธอคงรู้สึกแย่เอามากๆ ถ้ามีอะไรที่ฉันพอจะช่วยได้ก็บอกมาได้เลยนะ',
  'เสียใจ คือเสียใจ ไม่ไหว คือไม่ไหว แค่ยอมรับความอ่อนแอของตัวเองได้ก็เหมือนเราเข้มแข็งไปแล้วกว่าครึ่ง',
  'อย่าสูญเสีย ตัวตน เพราะขี้ปากของคนที่ไม่รู้จัก ตัวคุณ',
  'คุณค่าของความรักไม่มีวันสูญสลาย ยอมรับเถอะว่าการจากลานั้นเศร้าและเจ็บปวดเสมอ แต่จุดสิ้นสุด บางครั้งก็เป็นจุดเริ่มต้นของอะไรบางอย่างนะ',
  'คนเราไม่อาจกลับไปแก้ไขอดีต ที่ทำได้คือ การเรียนรู้จากมัน และไม่ทำมันอีก',
  'เป็นธรรมดาที่ช่วงหนึ่งของชีวิตที่เราจะรู้สึกแย่ แต่ขออย่าท้อแท้เพราะคงไม่มีใครที่จะแพ้ได้ทุกวัน',
  'เข้มแข็งไว้นะ',
  'อดีตอาจทำให้เจ็บปวด แต่คุณสามารถเลือกได้ว่าจะวิ่งหนี…หรือเรียนรู้จากมัน',
  'อย่าเพิ่งท้อนะ เธอทำได้เป็นอย่างมาก 🌟',
  'เมื่อเธอรู้สึกท้อแท้ ลองมองรอบๆ เธอจะพบว่ามีคนมากมายที่อยากเป็นกำลังใจให้เธอ',
  'เสมอตามตัวเธอไปนะ เพราะคนที่แข็งแรงมักจะพบความสำเร็จมากมายในที่ที่ไม่เคยคิด',
  'ความล้มเหลวไม่ใช่สิ้นสุด เป็นเพียงจุดเริ่มต้นของการเรียนรู้และการเติบโต',
  'คำปลอบใจที่ดีที่สุดคือการตั้งใจที่จะฟื้นตัวขึ้นมาอีกครั้ง',
  'ในทุกความทุกข์ มีโอกาสและเรียนรู้ที่มอบให้เราได้',
  'อนาคตที่ดีกว่ากำลังรออยู่เสมอ ไม่มีอะไรที่ไม่สามารถเปลี่ยนแปลงได้',
  'เปลี่ยนความล้มเหลวเป็นพลังใจในการก้าวไปข้างหน้า',
  'ความอ่อนแอไม่ได้หมายความว่าเธอไม่แข็งแรง มันแปลว่าเธอยังคงต่อสู้',
  'รักษาความสุขของเธอเป็นสิ่งสำคัญ ความสุขเริ่มต้นจากในใจของเธอเอง',
  'การเปลี่ยนแปลงไม่จำเป็นต้องเริ่มต้นใหม่ทั้งหมด บางครั้งมันเริ่มต้นจากการเปลี่ยนแปลงเล็กๆ น้อยๆ',
  'คิดให้ไกล แต่ใช้วันนี้ให้ดีที่สุด',
  'ไม่มีใครเข้าใจทุกสิ่งทุกอย่าง แต่เธอไม่ต้องเผชิญหน้าคนโลภ',
  'คนที่แข็งแรงไม่ได้มาจากการไม่เจอปัญหา แต่มาจากการเรียนรู้และทำให้ตัวเองแข็งแรงขึ้น',
  'การให้คำปรึกษาดีที่สุดมักจะมาจากประสบการณ์ที่เคยผ่านมา',
  'อย่างน้อยเธอก็ยังมีตัวเอง ที่รักและเข้าใจเธอมากที่สุด',
  'ความก้าวหน้ามักเกิดขึ้นเมื่อเรากล้าที่จะเดินออกจาก Comfort Zone',
  'ความฝันในใจของเธอมีค่ามากที่สุด อย่าปล่อยมันไป',
  'ทุกความพยายามนั้นมีความคืบหน้า ไม่ว่าจะเป็นมากน้อย',
  'ในความสำคัญที่เธอให้แก่คนอื่น อย่าลืมให้ความสำคัญกับตัวเธอเองด้วย',
  'การพักผ่อนกับตัวเองบ้างครั้งก็เป็นการดูแลสุขภาพจิตของเธอเอง',
];

export const CRYPTO_CURRENCIES_LIST: CryptoCurrency[] = [
  {
    symbol_th: 'หมา',
    symbol_en: 'doge',
  },
  {
    symbol_th: 'ยาย',
    symbol_en: 'iost',
  },
];
