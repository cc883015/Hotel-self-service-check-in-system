-- Support module seed (guest-visible info only; run after 0001_support.sql).

INSERT OR REPLACE INTO hotel_settings (key, value, description, updated_at) VALUES
  ('wifi_ssid', 'cliffinn / cliffinn A Building / cliffinn B Building — connect to your building network', 'Guest WiFi names', '2026-04-23T00:00:00Z'),
  ('wifi_password', 'cliffinn528', 'Guest WiFi password', '2026-04-23T00:00:00Z'),
  ('checkin_time', '2:00 PM', 'Check-in time', '2026-04-23T00:00:00Z'),
  ('checkout_time', '10:00 AM', 'Check-out time', '2026-04-23T00:00:00Z'),
  ('parking_location', 'Behind the building, right behind your room', 'Parking', '2026-04-23T00:00:00Z'),
  ('hotel_address', '532 Main Street, Kangaroo Point QLD 4169', 'Hotel address', '2026-04-23T00:00:00Z');

-- FAQ: en
INSERT OR REPLACE INTO faq_entries (id, intent, locale, question, answer, keywords, is_quick, sort_order, updated_at) VALUES
  ('faq-wifi-ssid-en', 'wifi_ssid', 'en', 'WiFi name', 'Our WiFi networks are **cliffinn**, **cliffinn A Building**, or **cliffinn B Building** — connect to the one for your building.', 'wifi,wi-fi,ssid,network,wireless,internet', 1, 10, '2026-04-23T00:00:00Z'),
  ('faq-wifi-pass-en', 'wifi_password', 'en', 'WiFi password', 'The WiFi password is **cliffinn528** (same for all networks).', 'wifi password,wi-fi password,passcode,wireless password,网络密码,密码', 1, 20, '2026-04-23T00:00:00Z'),
  ('faq-parking-en', 'parking', 'en', 'Parking', 'Parking is right behind the building, just behind your room.', 'parking,park,car,vehicle,车位,停车', 1, 30, '2026-04-23T00:00:00Z'),
  ('faq-checkin-en', 'checkin_time', 'en', 'Check-in time', 'Check-in time is **2:00 PM**.', 'check in,check-in,arrival,入住,几点入住', 1, 40, '2026-04-23T00:00:00Z'),
  ('faq-checkout-en', 'checkout_time', 'en', 'Check-out time', 'Check-out time is **10:00 AM**.', 'check out,check-out,departure,退房,几点退房', 1, 50, '2026-04-23T00:00:00Z'),
  ('faq-extend-en', 'extend_stay', 'en', 'Extend stay', 'To extend your stay, please come to reception **before 10:00 AM** to pay in person, **or** re-book the same room type on the platform where you booked online — we''ll do our best to keep you in the same room. If you have not extended by 10:00 AM and have left, the hotel reserves the right to move your belongings so a new guest can check in.', 'extend,stay,late checkout,延住,续住', 1, 60, '2026-04-23T00:00:00Z'),
  ('faq-laundry-en', 'laundry', 'en', 'Laundry', 'See nearby laundromats below (map links included).', 'laundry,laundromat,wash,dry,洗衣,洗衣店', 1, 70, '2026-04-23T00:00:00Z'),
  ('faq-dining-en', 'dining', 'en', 'Nearby dining', 'See nearby restaurants below (map links included).', 'food,restaurant,eat,dining,吃饭,餐饮,麦当劳', 1, 80, '2026-04-23T00:00:00Z'),
  ('faq-super-en', 'supermarket', 'en', 'Supermarket', 'See nearby supermarkets below (map links included).', 'supermarket,grocery,store,convenience,超市,便利店', 1, 90, '2026-04-23T00:00:00Z'),
  ('faq-damage-en', 'damage_report', 'en', 'Damage / complaint', 'For damage, faults, complaints, or urgent matters, please **contact reception in person** at the front desk.', 'damage,broken,complaint,urgent,emergency,损坏,投诉,紧急', 1, 100, '2026-04-23T00:00:00Z'),
  ('faq-things-en', 'things_to_do', 'en', 'Things to do', 'For sightseeing and things to do, browse up-to-date options on **Trip.com** or **Google Maps**. We cannot recommend specific attractions without verified data.', 'things to do,sightseeing,trip,tourism,游玩,景点', 0, 200, '2026-04-23T00:00:00Z');

-- FAQ: zh
INSERT OR REPLACE INTO faq_entries (id, intent, locale, question, answer, keywords, is_quick, sort_order, updated_at) VALUES
  ('faq-wifi-ssid-zh', 'wifi_ssid', 'zh', 'WiFi 账号', 'WiFi 名称为 **cliffinn**、**cliffinn A Building** 或 **cliffinn B Building**，请连接你所在楼栋对应的网络。', 'wifi,无线,网络,账号,名称', 1, 10, '2026-04-23T00:00:00Z'),
  ('faq-wifi-pass-zh', 'wifi_password', 'zh', 'WiFi 密码', 'WiFi 密码为 **cliffinn528**（所有网络通用）。', 'wifi密码,无线密码,密码,passcode', 1, 20, '2026-04-23T00:00:00Z'),
  ('faq-parking-zh', 'parking', 'zh', '停车场', '停车场就在楼栋后方，房间后边。', '停车,车位,停车场,parking', 1, 30, '2026-04-23T00:00:00Z'),
  ('faq-checkin-zh', 'checkin_time', 'zh', '入住时间', '入住时间为 **下午 2:00**。', '入住,check in,几点入住', 1, 40, '2026-04-23T00:00:00Z'),
  ('faq-checkout-zh', 'checkout_time', 'zh', '退房时间', '退房时间为 **上午 10:00**。', '退房,check out,几点退房', 1, 50, '2026-04-23T00:00:00Z'),
  ('faq-extend-zh', 'extend_stay', 'zh', '延住', '如需延住，请于**上午 10:00 前**到前台现场付款，**或**在你预订的在线平台再次预订相同房型，我们会尽量为你保留同一房间。若超过上午 10:00 仍未办理延住且已离开，酒店有权移走你的物品，以便新客人入住。', '延住,续住,late checkout', 1, 60, '2026-04-23T00:00:00Z'),
  ('faq-laundry-zh', 'laundry', 'zh', '洗衣', '附近洗衣店见下方列表（含地图链接）。', '洗衣,洗衣店,laundry', 1, 70, '2026-04-23T00:00:00Z'),
  ('faq-dining-zh', 'dining', 'zh', '周边吃饭', '附近餐饮见下方列表（含地图链接）。', '吃饭,餐饮,餐厅,food', 1, 80, '2026-04-23T00:00:00Z'),
  ('faq-super-zh', 'supermarket', 'zh', '附近超市', '附近超市见下方（含地图链接）。', '超市,便利店,grocery', 1, 90, '2026-04-23T00:00:00Z'),
  ('faq-damage-zh', 'damage_report', 'zh', '损坏/报修', '设施损坏、故障、投诉或紧急情况，请**到前台当面联系 reception**。', '损坏,报修,投诉,紧急,complaint', 1, 100, '2026-04-23T00:00:00Z'),
  ('faq-things-zh', 'things_to_do', 'zh', '周边游玩', '周边游玩攻略，建议在 **Trip.com** 或 **Google 地图** 上查看最新推荐。', '游玩,景点,旅游', 0, 200, '2026-04-23T00:00:00Z');

INSERT OR REPLACE INTO nearby_places (id, category, name, address, place_id, note, sort_order) VALUES
  ('np-laundry-1', 'laundry', 'WaterSpirit Coin Laundromat', '746 Main St', 'ChIJa5mC1xVakWsRQ9gEAwjVJcs', 'Nearest · 6 AM–10 PM daily', 10),
  ('np-laundry-2', 'laundry', 'Best Soapbox Laundromat', '831 Main St', 'ChIJ-WH6ix1bkWsRg9roEy6EB4k', '24 hours', 20),
  ('np-dining-1', 'dining', 'Pineapple Hotel', '706 Main St', 'ChIJq1b2aRZakWsRUBuvvkfZUMA', 'Pub meals · open till late', 10),
  ('np-dining-2', 'dining', 'McDonald''s Kangaroo Point', '796 Main St', 'ChIJxWwNyBVakWsRJyPmmBUZq-8', '24 hours', 20),
  ('np-dining-3', 'dining', 'KFC Kangaroo Point', '768 Main St', 'ChIJV4JO1hVakWsRWE58_vJaBZM', '', 30),
  ('np-super-1', 'supermarket', 'Coles Local Woolloongabba', '795 Stanley St', 'ChIJb9Qt2RRakWsRpwYevucGkBI', 'Approx. 7 AM–9 PM', 10),
  ('np-super-2', 'supermarket', 'Friendly Grocer Kangaroo Point', '681 Main St', 'ChIJrwb7XxZakWsRZGO4VJVXUaQ', '24 hours', 20),
  ('np-super-3', 'supermarket', 'Grab & Go Convenience', '777 Main St', 'ChIJexZ-WHdbkWsRFNMylpVKlf4', '', 30);

INSERT OR REPLACE INTO knowledge_base (id, title, content, locale, tags, updated_at) VALUES
  ('kb-house-en', 'House Rules', '1. No smoking or drugs in rooms. 2. No damage or theft of hotel property. 3. The hotel may report guest misconduct to online platforms. 4. If not extended by 10:00 AM and the guest has left, the hotel may move belongings for the next guest.', 'en', 'rules,policy', '2026-04-23T00:00:00Z'),
  ('kb-house-zh', '房间注意事项', '1. 房间内禁止吸烟及使用毒品。2. 禁止损坏酒店设施或盗窃。3. 酒店有权将客人不当行为上报网络平台。4. 若超过上午10:00未延住且已离开，酒店有权移走物品以便新客人入住。', 'zh', 'rules,policy', '2026-04-23T00:00:00Z'),
  ('kb-nearby-en', 'Nearby amenities', 'Laundry: WaterSpirit (746 Main St), Best Soapbox (831 Main St). Dining on Main St: Pineapple Hotel, McDonald''s, KFC. Groceries: Coles Woolloongabba, Friendly Grocer, Grab & Go.', 'en', 'nearby', '2026-04-23T00:00:00Z'),
  ('kb-nearby-zh', '周边汇总', '洗衣：WaterSpirit（746 Main St）、Best Soapbox（831 Main St）。餐饮：Pineapple Hotel、麦当劳、KFC。超市：Coles、Friendly Grocer、Grab & Go。', 'zh', 'nearby', '2026-04-23T00:00:00Z'),
  ('kb-extend-en', 'Extend stay policy', 'Extend before 10:00 AM at reception or re-book same room type online. After 10:00 AM without extension, belongings may be moved.', 'en', 'extend', '2026-04-23T00:00:00Z'),
  ('kb-extend-zh', '延住政策', '请于上午10:00前到前台延住或在线续订同房型；超时未延住且已离开，物品可能被移走。', 'zh', 'extend', '2026-04-23T00:00:00Z');
