import { safeLocalStorage } from "../utils/safeStorage";

export interface FarmerVoiceLanguage {
  code: string;
  bcp47: string;
  name: string;
  nativeName: string;
  badge: string;
  greetingPrompt: string;
}

export const FARMER_LANGUAGES: FarmerVoiceLanguage[] = [
  {
    code: "en",
    bcp47: "en-US",
    name: "English",
    nativeName: "English",
    badge: "EN",
    greetingPrompt: "Hello Farmer! Tap the microphone and speak your crop doubt or question in English.",
  },
  {
    code: "hi",
    bcp47: "hi-IN",
    name: "Hindi",
    nativeName: "हिन्दी",
    badge: "हिन्दी",
    greetingPrompt: "नमस्ते किसान भाई! माइक दबाकर अपनी फसल का सवाल या समस्या पूछें।",
  },
  {
    code: "ta",
    bcp47: "ta-IN",
    name: "Tamil",
    nativeName: "தமிழ்",
    badge: "தமிழ்",
    greetingPrompt: "வணக்கம் விவசாய நண்பரே! மைக் அழுத்தி பயிர் சந்தேகம் கேளுங்கள்.",
  },
  {
    code: "te",
    bcp47: "te-IN",
    name: "Telugu",
    nativeName: "తెలుగు",
    badge: "తెలుగు",
    greetingPrompt: "నమస్కారం రైతు సోదరుడా! మైక్ నొక్కి మీ పంట సందేహాన్ని అడగండి.",
  },
  {
    code: "mr",
    bcp47: "mr-IN",
    name: "Marathi",
    nativeName: "मराठी",
    badge: "मराठी",
    greetingPrompt: "नमस्कार शेतकरी मित्र! माईक दाबून आपल्या पिकाची शंका विचारा.",
  },
  {
    code: "pa",
    bcp47: "pa-IN",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    badge: "ਪੰਜਾਬੀ",
    greetingPrompt: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! ਮਾਈਕ ਦਬਾ ਕੇ ਆਪਣੀ ਫਸਲ ਬਾਰੇ ਪੁੱਛੋ।",
  },
  {
    code: "bn",
    bcp47: "bn-IN",
    name: "Bengali",
    nativeName: "বাংলা",
    badge: "বাংলা",
    greetingPrompt: "নমস্কার কৃষক বন্ধু! মাইক টিপে আপনার ফসলের সমস্যা বলুন।",
  },
  {
    code: "gu",
    bcp47: "gu-IN",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    badge: "ગુજરાતી",
    greetingPrompt: "નમસ્તે ખેડૂત મિત્ર! માઇક દબાવીને તમારા પાકની સમસ્યા પૂછો.",
  },
  {
    code: "kn",
    bcp47: "kn-IN",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    badge: "ಕನ್ನಡ",
    greetingPrompt: "ನಮಸ್ಕಾರ ರೈತ ಬಾಂಧವರೇ! ಮೈಕ್ ಒತ್ತಿ ನಿಮ್ಮ ಬೆಳೆಯ ಸಂದೇಹವನ್ನು ಕೇಳಿ.",
  },
  {
    code: "ml",
    bcp47: "ml-IN",
    name: "Malayalam",
    nativeName: "മലയാളം",
    badge: "മലയാളം",
    greetingPrompt: "നമസ്കാരം കർഷക സുഹൃത്തേ! മൈക്ക് അമർത്തി സംശയം ചോദിക്കൂ.",
  },
];

export interface FarmerDoubtPrompt {
  id: string;
  category: "pest" | "yellowing" | "fertilizer" | "irrigation" | "organic" | "yield" | "blight";
  title: string;
  icon: string;
  queryByLang: Record<string, string>;
}

export const COMMON_FARMER_DOUBTS: FarmerDoubtPrompt[] = [
  {
    id: "pest-attack",
    category: "pest",
    title: "कीट व इल्ली नियंत्रण (Pests)",
    icon: "🐛",
    queryByLang: {
      hi: "मेरी फसल में सुंडी और बारीक कीड़े लगे हैं, कौन सी दवा और कितनी मात्रा में स्प्रे करूँ?",
      ta: "என் பயிரில் பூச்சி மற்றும் புழுக்கள் தாக்குகின்றன. என்ன மருந்து தெளிக்க வேண்டும்?",
      te: "నా పంటలో పురుగులు మరియు కీటకాలు ఉన్నాయి, ఏ మందు స్ప్రే చేయాలి?",
      mr: "माझ्या पिकात अळी आणि किडीचा प्रादुर्भाव झाला आहे, कोणती फवारणी करावी?",
      pa: "ਮੇਰੀ ਫਸਲ ਵਿੱਚ ਸੁੰਡੀ ਤੇ ਕੀੜੇ ਲੱਗੇ ਹਨ, ਕਿਹੜੀ ਦਵਾਈ ਛਿੜਕਾਂ?",
      bn: "আমার ফসলে পোকা ও শুঁয়োপোকা লেগেছে, কোন ওষুধ স্প্রে করব?",
      gu: "મારા પાકમાં ઈયળ અને જીવાત લાગી છે, કઈ દવા છાંટવી?",
      kn: "ನನ್ನ ಬೆಳೆಯಲ್ಲಿ ಹುಳುಗಳು ಬಂದಿವೆ, ಯಾವ ಔಷಧ ಸಿಂಪಡಿಸಬೇಕು?",
      ml: "എന്റെ വിളയിൽ പുഴുക്കളുടെ ആക്രമണമുണ്ട്, എന്ത് മരുന്ന് തളിക്കണം?",
      en: "How do I control insect pests and caterpillars in my crop, and what is the exact dosage?",
    },
  },
  {
    id: "leaf-yellowing",
    category: "yellowing",
    title: "पत्तियों का पीलापन (Yellowing)",
    icon: "🍃",
    queryByLang: {
      hi: "पौधों की पत्तियां पीली पड़ रही हैं और किनारे सूख रहे हैं, इसका क्या कारण और समाधान है?",
      ta: "பயிரின் இலைகள் மஞ்சளாகி கருகுகின்றன, இதற்கு என்ன காரணம் மற்றும் தீர்வு?",
      te: "ఆకులు పసుపు రంగులోకి మారుతున్నాయి, కారణం ఏమిటి మరియు పరిష్కారం?",
      mr: "झाडांची पाने पिवळी पडून सुकत आहेत, याचे काय कारण व उपाय आहे?",
      pa: "ਪੱਤੇ ਪੀਲੇ ਪੈ ਰਹੇ ਹਨ ਅਤੇ ਸੁੱਕ ਰਹੇ ਹਨ, ਇਸਦਾ ਕੀ ਇਲਾਜ ਹੈ?",
      bn: "গাছের পাতা হলুদ হয়ে যাচ্ছে ও শুকিয়ে যাচ্ছে, এর প্রতিকার কি?",
      gu: "છોડના પાંદડા પીળા પડી રહ્યા છે, આનું શું કારણ અને ઉપાય છે?",
      kn: "ಎಲೆಗಳು ಹಳದಿಯಾಗುತ್ತಿವೆ ಮತ್ತು ಒಣಗುತ್ತಿವೆ, ಇದಕ್ಕೆ ಪರಿಹಾರವೇನು?",
      ml: "ഇലകൾ മഞ്ഞനിറമായി ഉണങ്ങുന്നു, ഇതിന്റെ പരിഹാരം എന്താണ്?",
      en: "Why are the crop leaves turning yellow and drying from the edges?",
    },
  },
  {
    id: "fertilizer-dosage",
    category: "fertilizer",
    title: "खाद व उर्वरक की सही मात्रा (Fertilizer)",
    icon: "🧪",
    queryByLang: {
      hi: "फूल और फल बनते समय कौन सा खाद, यूरिया या एनपीके कितनी मात्रा में डालना चाहिए?",
      ta: "பூக்கும் தருணத்தில் என்ன உரம் மற்றும் எவ்வளவு அளவு இட வேண்டும்?",
      te: "పూత మరియు కాయ దశలో ఏ ఎరువు ఎంత మోతాదులో వేయాలి?",
      mr: "फुलोरा आणि फळधारणेच्या वेळी कोणते खत आणि किती प्रमाणात द्यावे?",
      pa: "ਫੁੱਲ ਪੈਣ ਵੇਲੇ ਕਿਹੜੀ ਖਾਦ ਤੇ ਕਿੰਨੀ ਮਾਤਰਾ ਵਿੱਚ ਪਾਈਏ?",
      bn: "ফুল ও ফল আসার সময় কোন সার কতটুকু পরিমাণে দিতে হবে?",
      gu: "ફૂલ અને ફળ આવતી વખતે કયું ખાતર અને કેટલા પ્રમાણમાં આપવું?",
      kn: "ಹೂ ಮತ್ತು ಕಾಯಿ ಕಟ್ಟುವ ಹಂತದಲ್ಲಿ ಯಾವ ಗೊಬ್ಬರ ಎಷ್ಟು ಹಾಕಬೇಕು?",
      ml: "പൂവിടുന്ന സമയത്ത് ഏത് വളം എത്ര അളവിൽ നൽകണം?",
      en: "What fertilizer, NPK, or urea dosage should I apply during the flowering and fruit-setting stage?",
    },
  },
  {
    id: "irrigation-schedule",
    category: "irrigation",
    title: "सिंचाई व जल प्रबंधन (Watering)",
    icon: "💧",
    queryByLang: {
      hi: "वर्तमान मौसम में कितने दिनों के अंतराल पर पानी देना चाहिए और ज्यादा पानी से बचाव कैसे करें?",
      ta: "தற்போதைய பருவத்தில் எத்தனை நாட்களுக்கு ஒருமுறை பாசனம் செய்ய வேண்டும்?",
      te: "ప్రస్తుత వాతావరణంలో ఎన్ని రోజులకు ఒకసారి నీరు పెట్టాలి?",
      mr: "सध्याच्या हवामानात किती दिवसांच्या अंतराने पाणी द्यावे?",
      pa: "ਅੱਜ-ਕੱਲ੍ਹ ਦੇ ਮੌਸਮ ਵਿੱਚ ਕਿੰਨੇ ਦਿਨਾਂ ਬਾਅਦ ਪਾਣੀ ਲਗਾਈਏ?",
      bn: "বর্তমান আবহাওয়ায় কতদিন পর পর সেচ দেওয়া উচিত?",
      gu: "હાલના વાતાવરણમાં કેટલા દિવસે પાણી આપવું જોઈએ?",
      kn: "ಪ್ರಸ್ತುತ ವಾತಾವರಣದಲ್ಲಿ ಎಷ್ಟು ದಿನಗಳಿಗೊಮ್ಮೆ ನೀರುಣಿಸಬೇಕು?",
      ml: "നിലവിലെ കാലാവസ്ഥയിൽ എത്ര ദിവസത്തിലൊരിക്കൽ നനയ്ക്കണം?",
      en: "How frequently should I irrigate my crop in this season to prevent water stress or waterlogging?",
    },
  },
  {
    id: "organic-remedy",
    category: "organic",
    title: "जैविक कीटनाशक व जीवामृत (Organic)",
    icon: "🌿",
    queryByLang: {
      hi: "घर पर नीम का तेल, दशपर्णी अर्क या जीवामृत कैसे बनाएं और इसका छिड़काव कैसे करें?",
      ta: "வீட்டிலேயே வேப்பங்கொட்டை கரைசல் மற்றும் பஞ்சகவ்யா எப்படி தயாரிப்பது?",
      te: "జీవామృతం మరియు వేప కషాయం ఎలా తయారు చేసి పిచికారీ చేయాలి?",
      mr: "घरी दशपर्णी अर्क किंवा जीवामृत कसे तयार करावे व फवारणी कशी करावी?",
      pa: "ਘਰ ਵਿੱਚ ਨਿੰਮ ਦਾ ਕਾੜ੍ਹਾ ਜਾਂ ਜੀਵਾਮ੍ਰਿਤ ਕਿਵੇਂ ਤਿਆਰ ਕਰੀਏ?",
      bn: "বাড়িতে নিম তেল বা জৈব কীটনাশক কিভাবে তৈরি করব?",
      gu: "ઘરે લીમડાનું તેલ અથવા જીવામૃત કેવી રીતે બનાવવું?",
      kn: "ಮನೆಯಲ್ಲೇ ಜೀವಾಮೃತ ಮತ್ತು ಕೀಟನಾಶಕ ಕಷಾಯ ಹೇಗೆ ತಯಾರಿಸುವುದು?",
      ml: "വീട്ടിൽ വേപ്പെണ്ണ സ്പ്രേ അല്ലെങ്കിൽ ജൈവ കീടനാശിനി എങ്ങനെ ഉണ്ടാക്കാം?",
      en: "How do I prepare and spray organic Neem oil spray or Jeevamrutha at home?",
    },
  },
  {
    id: "yield-boost",
    category: "yield",
    title: "उपज और कल्ले बढ़ाने के उपाय (Yield Boost)",
    icon: "🌾",
    queryByLang: {
      hi: "फसल में ज्यादा फुटाव, कल्ले और फल-फूल की पैदावार बढ़ाने के लिए क्या उपाय करें?",
      ta: "பயிரில் அதிக கிளைகள் மற்றும் மகசூல் கிடைக்க என்ன செய்ய வேண்டும்?",
      te: "పంటలో అధిక పిలకలు మరియు దిగుబడి పెరగడానికి ఏమి చేయాలి?",
      mr: "पिकात जास्त फुटवे आणि भरपूर उत्पादन मिळण्यासाठी काय करावे?",
      pa: "ਫਸਲ ਦੇ ਫੁਟਾਰੇ ਅਤੇ ਵੱਧ ਝਾੜ ਲਈ ਕੀ ਉਪਾਅ ਕਰੀਏ?",
      bn: "ফসলে বেশি কুশি ও ফলন বাড়ানোর জন্য কি ব্যবস্থা নেব?",
      gu: "પાકમાં ફૂટ વધારે આવે અને ઉત્પાદન વધે તે માટે શું કરવું?",
      kn: "ಬೆಳೆಯಲ್ಲಿ ಹೆಚ್ಚು ಕವಲುಗಳು ಮತ್ತು ಅಧಿಕ ಇಳುವರಿ ಪಡೆಯಲು ಏನು ಮಾಡಬೇಕು?",
      ml: "വിളവിൽ കൂടുതൽ ശാഖകളും നല്ല ഉൽപാദനവും ലഭിക്കാൻ എന്തുചെയ്യണം?",
      en: "How do I increase tillering, branching, and overall crop yield per acre?",
    },
  },
  {
    id: "blight-fungus",
    category: "blight",
    title: "झुलसा व फफूंद रोग (Blight & Rust)",
    icon: "🍄",
    queryByLang: {
      hi: "पत्तियों और तने पर काले-भूरे धब्बे व झुलसा रोग है, कौन सा फफूंदनाशक स्प्रे करें?",
      ta: "இலைகளில் கரும் புள்ளிகள் மற்றும் கருகல் நோய் உள்ளது, என்ன மருந்து தெளிப்பது?",
      te: "ఆకులపై నల్ల మచ్చలు మరియు ఎండు తెగులు ఉంది, ఏ మందు కొట్టాలి?",
      mr: "पानांवर काळे-तपकिरी ठिपके आणि करपा रोग आहे, कोणती बुरशीनाशक फवारावी?",
      pa: "ਪੱਤਿਆਂ 'ਤੇ ਕਾਲੇ ਧੱਬੇ ਤੇ ਝੁਲਸ ਰੋਗ ਹੈ, ਕਿਹੜੀ ਉੱਲੀਨਾਸ਼ਕ ਦਵਾਈ ਛਿੜਕਾਂ?",
      bn: "পাতায় কালো দাগ ও ধসা রোগ হয়েছে, কোন ছত্রাকনাশক স্প্রে করব?",
      gu: "પાંદડા પર કાળા ડાઘ અને સુકારો છે, કઈ ફૂગનાશક દવા છાંટવી?",
      kn: "ಎಲೆಗಳ ಮೇಲೆ ಕಪ್ಪು ಕಲೆಗಳು ಮತ್ತು ಮಚ್ಚೆ ರೋಗವಿದೆ, ಯಾವ ಶಿಲೀಂಧ್ರನಾಶಕ ಸಿಂಪಡಿಸಬೇಕು?",
      ml: "ഇലകളിൽ കറുത്ത പാടുകളും കരിച്ചിലും ഉണ്ട്, ഏത് കുമിൾനാശിനി ഉപയോഗിക്കണം?",
      en: "My crop leaves have black/brown spots and fungal blight. Which fungicide should I spray?",
    },
  },
];

export const POPULAR_CROPS = [
  { name: "Tomato (தக்காளி / टमाटर)", key: "tomato" },
  { name: "Wheat (கோதுமை / गेहूं)", key: "wheat" },
  { name: "Paddy/Rice (நெல் / धान)", key: "paddy" },
  { name: "Cotton (பருத்தி / कपास)", key: "cotton" },
  { name: "Chilli (மிளகாய் / मिर्च)", key: "chilli" },
  { name: "Potato (உருளை / आलू)", key: "potato" },
  { name: "Mustard (கடுகு / सरसों)", key: "mustard" },
  { name: "Maize (மக்காச்சோளம் / मक्का)", key: "maize" },
  { name: "Soybean (சோயாபீன் / सोयाबीन)", key: "soybean" },
  { name: "Onion (வெங்காயம் / प्याज)", key: "onion" },
  { name: "Brinjal (கத்தரி / बैंगन)", key: "brinjal" },
  { name: "Sugarcane (கரும்பு / गन्ना)", key: "sugarcane" },
  { name: "Rose & Flowers (ரோஜா / फूल)", key: "rose" },
  { name: "Fruit Crops (பழங்கள் / फल)", key: "fruits" },
  { name: "Indoor & Garden (வீட்டு செடிகள்)", key: "indoor" },
];

export const PLANTCARE_WELCOME_GREETINGS: Record<string, string[]> = {
  en: [
    "Hello! I'm PlantCare AI. What would you like to know about your plant or crop?",
    "Welcome to PlantCare AI! How can I help your crop, plant, or garden thrive today?",
  ],
  ta: [
    "வணக்கம்! நான் PlantCare AI. உங்கள் செடி அல்லது பயிரைப் பற்றி என்ன தெரிந்து கொள்ள வேண்டும்?",
    "வணக்கம்! உங்கள் பயிரின் பாதுகாப்பு மற்றும் வளர்ச்சிக்கு நான் எப்படி உதவலாம்?",
  ],
  hi: [
    "नमस्ते! मैं PlantCare AI हूँ। अपनी फसल या पौधे के बारे में क्या जानना चाहते हैं?",
    "प्रणाम! आपकी फसल, पौधे या बागवानी में क्या समस्या आ रही है?",
  ],
  te: [
    "నమస్కారం! నేను PlantCare AI. మీ పంట లేదా మొక్క గురించి ఏమి తెలుసుకోవాలనుకుంటున్నారు?",
  ],
  mr: [
    "नमस्कार! मी PlantCare AI आहे. आपल्या पिकाबद्दल किंवा झाडाबद्दल काय जाणून घ्यायचे आहे?",
  ],
  pa: [
    "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ PlantCare AI ਹਾਂ। ਆਪਣੀ ਫਸਲ ਜਾਂ ਬੂਟੇ ਬਾਰੇ ਕੀ ਪੁੱਛਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
  ],
  bn: [
    "নমস্কার! আমি PlantCare AI. আপনার ফসল বা গাছপালা সম্পর্কে কি জানতে চান?",
  ],
  gu: [
    "નમસ્તે! હું PlantCare AI છું. તમારા પાક કે છોડ વિશે શું જાણવું છે?",
  ],
  kn: [
    "ನಮಸ್ಕಾರ! ನಾನು PlantCare AI. ನಿಮ್ಮ ಬೆಳೆ ಅಥವಾ ಗಿಡದ ಬಗ್ಗೆ ಏನು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ?",
  ],
  ml: [
    "നമസ്കാരം! ഞാൻ PlantCare AI. നിങ്ങളുടെ വിളയെക്കുറിച്ചോ ചെടിയെക്കുറിച്ചോ എന്താണ് അറിയേണ്ടത്?",
  ],
};

export function getRandomWelcomeGreeting(langCode: string): string {
  const options = PLANTCARE_WELCOME_GREETINGS[langCode] || PLANTCARE_WELCOME_GREETINGS.en;
  const index = Math.floor(Math.random() * options.length);
  return options[index];
}

export interface FarmerVoiceAdvice {
  id: string;
  assistantName?: string;
  question: string;
  language: string;
  detectedLanguage?: string;
  detectedLanguageName?: string;
  spokenSummary: string;
  diagnosis: string;
  crop: string;
  immediateSteps: string[];
  organicRemedy: string;
  precautions: string;
  imageUrl?: string;
  audioUrl?: string;
  createdAt: string;
}

export interface FarmerVoiceRequest {
  question: string;
  language: string;
  cropName?: string;
  growthStage?: string;
  soilType?: string;
  imageFile?: File | null;
  imageBase64?: string;
  history?: Array<{ role: string; text: string }>;
}

const FARMER_HISTORY_KEY = "kisan_voice_doubts_history_v1";

export function loadSavedFarmerDoubts(): FarmerVoiceAdvice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = safeLocalStorage.getItem(FARMER_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveFarmerDoubt(advice: FarmerVoiceAdvice): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadSavedFarmerDoubts();
    const updated = [advice, ...current.filter((item) => item.id !== advice.id)].slice(0, 30);
    safeLocalStorage.setItem(FARMER_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function clearSavedFarmerDoubts(): void {
  if (typeof window === "undefined") return;
  try {
    safeLocalStorage.removeItem(FARMER_HISTORY_KEY);
  } catch {
    // ignore
  }
}

export async function askFarmerVoiceAssistant(
  req: FarmerVoiceRequest
): Promise<FarmerVoiceAdvice> {
  const formData = new FormData();
  formData.append("question", req.question);
  formData.append("language", req.language);
  if (req.cropName) formData.append("cropName", req.cropName);
  if (req.growthStage) formData.append("growthStage", req.growthStage);
  if (req.soilType) formData.append("soilType", req.soilType);
  if (req.history && req.history.length > 0) {
    formData.append("history", JSON.stringify(req.history));
  }
  if (req.imageFile) {
    formData.append("image", req.imageFile);
  } else if (req.imageBase64) {
    formData.append("imageBase64", req.imageBase64);
  }

  const res = await fetch("/api/farmer-voice", {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data || !data.spokenSummary) {
    throw new Error(data?.message || data?.error || "Failed to get advice from PlantCare AI Voice Assistant");
  }

  return data as FarmerVoiceAdvice;
}

export async function fetchFarmerStudioTts(
  text: string,
  language: string
): Promise<{ audio: string; mimeType: string } | null> {
  try {
    const res = await fetch("/api/farmer-tts", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.audio) {
      return { audio: data.audio, mimeType: data.mimeType || "audio/wav" };
    }
    return null;
  } catch {
    return null;
  }
}
