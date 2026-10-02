import { Book } from "../types";

export const MOCK_BOOKS: Book[] = [
  {
    id: "book-1",
    slug: "atomic-habits",
    title: "Atomic Habits",
    author: "James Clear",
    description:
      "An extremely practical guide on how small changes can lead to remarkable results. James Clear distills complex ideas from biology, psychology, and neuroscience to create an easy-to-understand framework for making good habits inevitable and bad habits impossible.",
    coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
    format: "interactive",
    isbn: "978-0735211292",
    language: "English",
    categoryId: "cat-self-dev",
    categoryName: "Self Development",
    tags: ["Habits", "Psychology", "Productivity", "Behavior"],
    publisher: "Avery / Penguin Random House",
    publicationDate: "2018-10-16",
    pages: 320,
    featured: true,
    trending: true,
    popular: true,
    status: "published",
    rating: 4.92,
    ratingCount: 1420,
    readCount: 5280,
    fileSize: "2.4 MB",
    createdAt: "2024-01-15T00:00:00Z",
    sampleContent:
      "Changes that seem small and unimportant at first will compound into remarkable results if you are willing to stick with them for years. We all deal with setbacks, but in the long run, the quality of our lives often depends on the quality of our habits. With the same habits, you will end up with the same results. But with better habits, anything is possible.",
    tableOfContents: [
      { title: "Introduction: My Story", page: 1 },
      { title: "The Fundamentals: Why Tiny Changes Make a Big Difference", page: 12 },
      { title: "The 1st Law: Make It Obvious", page: 48 },
      { title: "The 2nd Law: Make It Attractive", page: 89 },
      { title: "The 3rd Law: Make It Easy", page: 139 },
      { title: "The 4th Law: Make It Satisfying", page: 185 },
      { title: "Advanced Tactics: How to Go from Being Merely Good to Being Truly Great", page: 231 },
    ],
    chapters: [
      {
        id: "ah-ch1",
        title: "Introduction: The Surprising Power of Atomic Habits",
        page: 1,
        content: `The fate of British Cycling changed one day in 2003. The organization, which was the governing body for professional cycling in Great Britain, had recently hired Dave Brailsford as its new performance director. At the time, professional cyclists in Great Britain had endured nearly one hundred years of mediocrity. Since 1908, British riders had won just a single gold medal at the Olympic Games, and they had fared even worse in cycling's biggest race, the Tour de France. In 110 years, no British cyclist had ever won the event. In fact, the performance of British riders had been so underwhelming that one of the top bike manufacturers in Europe refused to sell bikes to the team because they were afraid that it would hurt sales if other professionals saw the Brits using their gear.

Brailsford had been hired to put British Cycling on a new trajectory. What made him different from previous coaches was his relentless commitment to a strategy that he referred to as "the aggregation of marginal gains," which was the philosophy of searching for a tiny margin of improvement in everything you do. Brailsford said, "The whole principle came from the idea that if you broke down everything you could think of that goes into riding a bike, and then improve it by 1 percent, you will get a significant increase when you put them all together."

They redesigned the bike seats to make them more comfortable and rubbed alcohol on the tires for a better grip. They asked riders to wear electrically heated overshorts to maintain ideal muscle temperature while riding and used wind tunnel testing to evaluate different aerodynamic fabrics.

Just five years after Brailsford took over, the British Cycling team dominated the road and track cycling events at the 2008 Olympic Games in Beijing, where they won an astounding 60 percent of the gold medals available. Four years later, when the Olympic Games came to London, the Brits raised the bar as they set nine Olympic records and seven world records. That same year, Bradley Wiggins became the first British cyclist to win the Tour de France.

Why do small habits make such a large difference? Too often, we convince ourselves that massive success requires massive action. Whether it is losing weight, building a business, writing a book, winning a championship, or achieving any other goal, we put pressure on ourselves to make some earth-shattering improvement that everyone will talk about.

Meanwhile, improving by 1 percent isn't particularly notable—sometimes it isn't even noticeable—but it can be far more meaningful, especially in the long run. The difference a tiny improvement can make over time is astounding. Here's how the math works out: if you can get 1 percent better each day for one year, you'll end up thirty-seven times better by the time you're done. Conversely, if you get 1 percent worse each day for one year, you'll decline nearly down to zero. What starts as a small win or a minor setback accumulates into something much more.`,
      },
      {
        id: "ah-ch2",
        title: "How Your Habits Shape Your Identity (and Vice Versa)",
        page: 12,
        content: `Why is it so easy to repeat bad habits and so hard to form good ones? Few things can have a more powerful impact on your life than improving your daily habits. And yet it is likely that this time next year you'll be doing the same thing rather than something better.

It often feels difficult to keep good habits going for more than a few days, even with sincere effort and the occasional burst of motivation. Habits like exercise, meditation, journaling, and cooking are reasonable for a day or two and then become a hassle.

However, once your habits are established, they seem to stick around forever—especially the unwanted ones. Despite our best intentions, unhealthy habits like eating junk food, watching too much television, procrastinating, and smoking can feel impossible to break.

Changing our habits is challenging for two reasons: (1) we try to change the wrong thing and (2) we try to change our habits in the wrong way.

There are three layers of behavior change: a change in your outcomes, a change in your processes, or a change in your identity.

The first layer is changing your outcomes. This level is concerned with changing your results: losing weight, publishing a book, winning a championship. Most of the goals you set are associated with this level of change.

The second layer is changing your process. This level is concerned with changing your habits and systems: implementing a new routine at the gym, decluttering your desk for better workflow, developing a meditation practice. Most of the habits you build are associated with this level.

The third and deepest layer is changing your identity. This level is concerned with changing your beliefs: your worldview, your self-image, your judgments about yourself and others. Most of the beliefs, assumptions, and biases you hold are associated with this level.

The goal is not to read a book, the goal is to become a reader. The goal is not to run a marathon, the goal is to become a runner. The goal is not to learn an instrument, the goal is to become a musician.`,
      },
      {
        id: "ah-ch3",
        title: "The 1st Law: Make It Obvious",
        page: 48,
        content: `In the mid-1800s, the French philosopher Denis Diderot lived nearly his entire life in poverty. But then his fortunes changed abruptly. In 1765, Catherine the Great, Empress of Russia, heard of Diderot's financial troubles and offered to buy his library for one thousand British pounds—equivalent to more than $150,000 today. Suddenly, Diderot had money to spare.

Soon after acquiring his new wealth, Diderot acquired a scarlet robe. It was beautiful. So beautiful, in fact, that he immediately noticed how out of place it looked when surrounded by the rest of his common possessions. He wrote that there was "no more coordination, no more unity, no more beauty" between his elegant robe and the rest of his stuff.

Diderot soon felt the urge to upgrade his furnishings. He replaced his rug with one from Damascus. He decorated his home with expensive sculptures. He bought a new mirror to place over the mantle. He purchased a handsome writing desk.

This cascade of purchases has become known as the Diderot Effect. The Diderot Effect states that obtaining a new possession often creates a spiral of consumption that leads to additional purchases.

You can spot this pattern everywhere: You buy a new dress and now you have to get matching shoes and earrings. You buy a new couch and suddenly question the look of your entire living room.

You never make habits in a vacuum. Each action becomes a cue that triggers the next behavior.

One of the best ways to build a new habit is to identify a current habit you already do each day and then stack your new behavior on top. This is called habit stacking.

The habit stacking formula is:
"After [CURRENT HABIT], I will [NEW HABIT]."

For example:
- Meditation: "After I pour my cup of coffee each morning, I will meditate for one minute."
- Gratitude: "After I sit down to dinner, I will say one thing I'm grateful for that happened today."
- Reading: "After I get into bed at night, I will read three pages of my book."`,
      },
    ],
  },
  {
    id: "book-2",
    slug: "the-psychology-of-money",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    description:
      "Doing well with money isn't necessarily about what you know. It's about how you behave. And behavior is hard to teach, even to really smart people. Morgan Housel shares 19 short stories exploring the strange ways people think about money.",
    coverUrl: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?auto=format&fit=crop&q=80&w=800",
    format: "interactive",
    isbn: "978-0857197689",
    language: "English",
    categoryId: "cat-business",
    categoryName: "Business & Wealth",
    tags: ["Investing", "Psychology", "Finance", "Wealth"],
    publisher: "Harriman House",
    publicationDate: "2020-09-08",
    pages: 256,
    featured: true,
    trending: true,
    popular: true,
    status: "published",
    rating: 4.88,
    ratingCount: 980,
    readCount: 4120,
    fileSize: "1.9 MB",
    createdAt: "2024-02-01T00:00:00Z",
    sampleContent:
      "The premise of this book is that doing well with money has a little to do with how smart you are and a lot to do with how you behave. A genius who loses control of their emotions can be a financial disaster. The opposite is also true. Ordinary folks with no financial education can be wealthy if they have a handful of behavioral skills that have nothing to do with formal measures of intelligence.",
    tableOfContents: [
      { title: "Introduction: The Greatest Show on Earth", page: 1 },
      { title: "Chapter 1: No One's Crazy", page: 14 },
      { title: "Chapter 2: Luck & Risk", page: 32 },
      { title: "Chapter 3: Never Enough", page: 48 },
      { title: "Chapter 4: Confounding Compounding", page: 65 },
    ],
    chapters: [
      {
        id: "pom-ch1",
        title: "Introduction: The Greatest Show on Earth",
        page: 1,
        content: `Ronald James Read was an American philanthropist, investor, janitor, and gas station attendant. Ronald Read grew up in rural Vermont. He was the first in his family to graduate from high school, made all the more impressive by the fact that he hitchhiked to school each day.

To those who knew him, there was little else noteworthy about his life. Read fixed cars at a gas station for twenty-five years and swept floors at JCPenney for seventeen years. He bought a two-bedroom house for $12,000 at age thirty-eight and lived there for the rest of his life. He was widowed at fifty and never remarried. A friend recalled that his main hobby was chopping firewood.

Read died in 2014, age ninety-two. Which is when the humble rural janitor made international headlines.

2,813,503 Americans died in 2014. Fewer than four thousand of them had a net worth of over $8 million when they passed away. Ronald Read was one of them.

In his will, the former janitor left $2 million to his stepchildren and more than $6 million to his local hospital and library.

Those who knew Read were baffled. Where did he get all that money? It turned out there was no secret. There was no lottery win and no inheritance. Read saved what little he could and invested it in blue chip stocks. Then he waited, for decades on end, as tiny compound interest compounded into more than $8 million.

That's it. From janitor to philanthropist.

Now consider Richard Fuscone. A Harvard-educated Merrill Lynch executive with an MBA, Fuscone had such a successful career in finance that he retired in his forties to become a philanthropist. Former Merrill CEO David Komansky praised Fuscone's "business savvy, leadership skills, sound judgment and personal integrity."

In the mid-2000s, Fuscone borrowed heavily to expand an 18,000-square-foot home in Greenwich, Connecticut, that had eleven bathrooms, two elevators, two pools, seven fireplaces, and an $80,000-a-month mortgage. Then the 2008 financial crisis hit. It turned his illiquid wealth into dust. In 2014, the mansion was sold in foreclosure for a fraction of its cost.

Ronald Read was patient; Richard Fuscone was greedy. That alone made all the difference.`,
      },
      {
        id: "pom-ch2",
        title: "Chapter 1: No One's Crazy",
        page: 14,
        content: `Your personal experiences with money make up maybe 0.00000001% of what's happened in the world, but maybe 80% of how you think the world works.

Someone who grew up during the Great Depression thinks about risk and reward in ways that a tech worker coming of age during the late 1990s bull market cannot fathom. The person who grew up in poverty thinks about risk and reward in ways that the privileged child of an investment banker cannot comprehend.

Every decision people make with money makes sense to them in that moment, based on the mental model of the world they have constructed. They might be misinformed. They might have incomplete information. They might be bad at math. But every financial decision is a reflection of a personal story.`,
      },
    ],
  },
  {
    id: "book-3",
    slug: "meditations-marcus-aurelius",
    title: "Meditations",
    author: "Marcus Aurelius",
    description:
      "A series of personal reflections and private notes written by the Roman Emperor Marcus Aurelius between 161 and 180 AD. Recorded without any intention of publication, Meditations is one of the greatest works of Stoic philosophy and spiritual resilience.",
    coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800",
    format: "interactive",
    isbn: "978-0140449334",
    language: "English",
    categoryId: "cat-philosophy",
    categoryName: "Philosophy & Religion",
    tags: ["Stoicism", "Philosophy", "Wisdom", "Leadership"],
    publisher: "Penguin Classics",
    publicationDate: "2006-04-27",
    pages: 254,
    featured: true,
    trending: false,
    popular: true,
    status: "published",
    rating: 4.85,
    ratingCount: 1650,
    readCount: 6890,
    fileSize: "1.4 MB",
    createdAt: "2024-01-10T00:00:00Z",
    sampleContent:
      "When you wake up in the morning, tell yourself: The people I deal with today will be meddling, ungrateful, arrogant, dishonest, jealous, and surly. They are like this because they cannot distinguish good from evil. But I have seen the beauty of good, and the ugliness of evil, and have recognized that the wrongdoer has a nature related to my own.",
    tableOfContents: [
      { title: "Book 1: Debts and Lessons", page: 1 },
      { title: "Book 2: On the River Gran, Among the Quadi", page: 19 },
      { title: "Book 3: In Carnuntum", page: 35 },
      { title: "Book 4: The Inner Citadel", page: 54 },
    ],
    chapters: [
      {
        id: "med-ch1",
        title: "Book 2: On the River Gran, Among the Quadi",
        page: 19,
        content: `When you wake up in the morning, tell yourself: The people I deal with today will be meddling, ungrateful, arrogant, dishonest, jealous, and surly. They are like this because they cannot distinguish good from evil.

But I have seen the beauty of good, and the ugliness of evil, and have recognized that the wrongdoer has a nature related to my own—not of the same blood or birth, but the same mind, and possessing a share of the divine. And so none of them can hurt me. No one can implicate me in ugliness. Nor can I feel angry at my relative, or hate him. We were born to work together like feet, hands, and eyes, like the two rows of teeth, upper and lower. To obstruct each other is unnatural. To feel anger at someone, to turn your back on him: these are obstructions.

Whatever this is that I am, it is a little flesh and breath, and the ruling part. Despise the flesh: blood and bones and a network, a jumble of nerves, veins, and arteries. Consider the breath: wind, constantly changing, expelled and sucked back in again.

Third is the ruling part. Think of it this way: You are an old man. Stop allowing your mind to be a slave, to be jerked about by selfish impulses, to kick at your present destiny, or to dread your future.

What is divine is full of Providence. Even chance is not divorced from nature, from the inweaving and enfolding of things governed by Providence. Everything flows from there.

Remember how long you've been putting this off, how many times the gods have sponsored you and you haven't made use of it. You have a limit on your time. If you do not use it to clear the clouds away, it will be gone and never return.`,
      },
      {
        id: "med-ch2",
        title: "Book 4: The Inner Citadel",
        page: 54,
        content: `People look for retreats for themselves, in the country, by the coast, or in the hills. There is nowhere that a person can find a more peaceful and trouble-free retreat than in his own mind. Especially if he has inside himself the kind of thoughts that an inspection will immediately bring complete tranquility. And by tranquility I mean nothing other than proper order.

So continually give yourself this retreat, and renew yourself. Let your basic principles be brief and fundamental, the kind that will immediately wash away all sorrow and send you back without resentment to the life you must return to.

What is it that bothers you? The wickedness of people? Remind yourself of the conclusion that rational beings exist for one another's sake, that tolerance is a part of justice, and that people do not do wrong deliberately.

Or does your physical lot disturb you? Recall the alternative: either Providence or atoms.

Choose not to be harmed—and you won't feel harmed. Don't feel harmed—and you haven't been.`,
      },
    ],
  },
  {
    id: "book-4",
    slug: "godan-munshi-premchand",
    title: "Godan (गोदान)",
    author: "Munshi Premchand",
    description:
      "Godan is considered the greatest novel of modern Hindi literature. Written by Munshi Premchand, it portrays the socioeconomic deprivation as well as the exploitation of the Indian peasantry during colonial rule through the poignant tale of Hori and Dhania.",
    coverUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=800",
    format: "interactive",
    isbn: "978-8128801464",
    language: "Hindi",
    categoryId: "cat-hindi",
    categoryName: "Hindi Literature",
    tags: ["Hindi Classics", "Social Realism", "Indian Literature", "Premchand"],
    publisher: "Saraswati Press",
    publicationDate: "1936-05-01",
    pages: 384,
    featured: true,
    trending: true,
    popular: true,
    status: "published",
    rating: 4.95,
    ratingCount: 1890,
    readCount: 7420,
    fileSize: "2.1 MB",
    createdAt: "2024-01-20T00:00:00Z",
    sampleContent:
      "होरी महतो ने दोनों बैलों को सानी-पानी देकर अपनी पत्नी धनिया से कहा—गोबर को खेत पर भेज देना, मैं ज़रा रायसाहब की तरफ़ जाता हूँ। धनिया ने शंकित होकर कहा—इतने सबेरे रायसाहब के यहाँ क्या काम है? आज तो खेत में पानी लगना था।",
    tableOfContents: [
      { title: "अध्याय 1: होरी और धनिया की अभिलाषा", page: 1 },
      { title: "अध्याय 2: रायसाहब का दरबार", page: 24 },
      { title: "अध्याय 3: भोला की गाय और होरी का मोह", page: 52 },
      { title: "अध्याय 4: ग्रामीण जीवन की विषमताएँ", page: 86 },
    ],
    chapters: [
      {
        id: "godan-ch1",
        title: "अध्याय 1: होरी और धनिया की अभिलाषा",
        page: 1,
        content: `होरी महतो ने दोनों बैलों को सानी-पानी देकर अपनी पत्नी धनिया से कहा—"गोबर को खेत पर भेज देना, मैं ज़रा रायसाहब की तरफ़ जाता हूँ।"

धनिया ने उसके मैले कुरते और फटी धोती को देखकर शंकित दृष्टि से पूछा—"इतने सबेरे रायसाहब के यहाँ क्या काम है? आज तो पछुआँ खेत में पानी लगना था।"

होरी ने पगड़ी बाँधते हुए कहा—"रायसाहब ने बुलवाया है। न जाऊँ तो साहब नाराज़ हो जाएँगे। उनकी कृपा न रहे, तो गाँव में रहना मुहाल हो जाए। ज़मींदार का मुँह जोहे बिना किसान का गुज़ारा कहाँ!"

धनिया व्यावहारिक स्त्री थी। वह जानती थी कि किसानों की सारी विपन्नता का मूल कारण यही ज़मींदारों की खुशामद और कर्ज़ का जाल है। उसने तिनककर कहा—"तुम्हारी तो उम्र इसी खुशामद में बीत गई, मिला क्या? चार बीघे खेत और पचास महाजनों का कर्ज़। तन पर कपड़ा नहीं, पेट में दाना नहीं।"

होरी ने एक ठंडी साँस भरी। उसके चेहरे पर झुर्रियों का जाल बिछा हुआ था। उम्र अभी चालीस से ऊपर न थी, पर बाल पक चुके थे और गाल धँस गए थे। लेकिन उसके हृदय में अब भी एक लालसा जीवित थी—द्वार पर एक गाय बँधी हो! एक सुंदर, दूध देने वाली कपिला गाय, जिसे देखकर द्वार की शोभा बढ़ जाए, जिसका दूध-मट्ठा घर के बाल-बच्चे पी सकें और अंत समय पर वैतरणी पार करने के लिए जिसकी पूँछ पकड़ी जा सके।

यह केवल धार्मिक विश्वास नहीं था, यह किसान का गौरव था। जिसके द्वार पर गाय नहीं, वह किसान कैसा?

होरी लाठी टेकता हुआ पगडंडी पर चल पड़ा। सूर्य की सुनहरी किरणें आम के बागों से छनकर आ रही थीं। चिड़ियों का कलरव शांत ग्रामीण वातावरण को जीवंत बना रहा था। होरी के मन में आशा और निराशा की धूप-छाँव चल रही थी।`,
      },
    ],
  },
  {
    id: "book-5",
    slug: "deep-work-cal-newport",
    title: "Deep Work: Rules for Focused Success",
    author: "Cal Newport",
    description:
      "Deep work is the ability to focus without distraction on a cognitively demanding task. Cal Newport demonstrates that deep work is a superpower in our increasingly competitive twenty-first-century economy, where superficial multitasking reigns supreme.",
    coverUrl: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=800",
    format: "interactive",
    isbn: "978-1455586691",
    language: "English",
    categoryId: "cat-technology",
    categoryName: "Technology",
    tags: ["Productivity", "Focus", "Technology", "Deep Work"],
    publisher: "Grand Central Publishing",
    publicationDate: "2016-01-05",
    pages: 304,
    featured: false,
    trending: true,
    popular: true,
    status: "published",
    rating: 4.81,
    ratingCount: 840,
    readCount: 3870,
    fileSize: "2.2 MB",
    createdAt: "2024-02-12T00:00:00Z",
    sampleContent:
      "Deep Work: Professional activities performed in a state of distraction-free concentration that push your cognitive capabilities to their limit. These efforts create new value, improve your skill, and are hard to replicate.",
    tableOfContents: [
      { title: "Introduction", page: 1 },
      { title: "Part 1: The Idea — Deep Work is Valuable", page: 15 },
      { title: "Part 2: The Rules — Rule #1 Work Deeply", page: 85 },
      { title: "Rule #2: Embrace Boredom", page: 145 },
      { title: "Rule #3: Quit Social Media", page: 181 },
      { title: "Rule #4: Drain the Shallows", page: 215 },
    ],
    chapters: [
      {
        id: "dw-ch1",
        title: "Introduction: The Deep Work Hypothesis",
        page: 1,
        content: `In the Swiss canton of St. Gallen, near the northern banks of Lake Zurich, sits the small village of Bollingen. In 1922, the psychiatrist Carl Jung chose this spot to begin building a retreat. He started with a basic two-story stone house he called the Tower.

When Jung retreated to the Tower, he locked himself in his private office every morning starting at 7:00 a.m. to write for two hours without interruption. He would spend his afternoons walking through the surrounding hills or meditating in his garden. There was no electricity; what light was needed came from oil lamps, and warmth was provided by fireplaces.

Jung did not retreat to Bollingen to escape work. He went to Bollingen to perform work that was far deeper and more demanding than the clinical meetings of his busy Zurich practice. This focused sanctuary produced some of the foundational theories of analytical psychology.

The Deep Work Hypothesis: The ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable in our economy. As a consequence, the few who cultivate this skill, and then make it the core of their working life, will thrive.`,
      },
    ],
  },
  {
    id: "book-6",
    slug: "the-great-gatsby",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    description:
      "Set in the Jazz Age on Long Island, the novel depicts narrator Nick Carraway's interactions with mysterious millionaire Jay Gatsby and Gatsby's obsession to reunite with his former lover, Daisy Buchanan. A profound critique of the American Dream.",
    coverUrl: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=800",
    format: "interactive",
    isbn: "978-0743273565",
    language: "English",
    categoryId: "cat-literature",
    categoryName: "Literature & Classics",
    tags: ["Classics", "Jazz Age", "American Literature", "Novel"],
    publisher: "Charles Scribner's Sons",
    publicationDate: "1925-04-10",
    pages: 180,
    featured: false,
    trending: false,
    popular: true,
    status: "published",
    rating: 4.76,
    ratingCount: 3120,
    readCount: 9410,
    fileSize: "1.2 MB",
    createdAt: "2024-01-05T00:00:00Z",
    sampleContent:
      "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since. 'Whenever you feel like criticizing any one,' he told me, 'just remember that all the people in this world haven't had the advantages that you've had.'",
    tableOfContents: [
      { title: "Chapter 1: The Advice and West Egg", page: 1 },
      { title: "Chapter 2: The Valley of Ashes", page: 23 },
      { title: "Chapter 3: Gatsby's Party", page: 44 },
      { title: "Chapter 4: The Mystery Revealed", page: 68 },
    ],
    chapters: [
      {
        id: "gg-ch1",
        title: "Chapter 1: The Advice and West Egg",
        page: 1,
        content: `In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.

"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven't had the advantages that you've had."

He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I'm inclined to reserve all judgments, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores.

When I came back from the East last autumn I felt that I wanted the world to be in uniform and at a sort of moral attention forever; I wanted no more riotous excursions with privileged glimpses into the human heart. Only Gatsby, the man who gives his name to this book, was exempt from my reaction—Gatsby, who represented everything for which I have an unaffected scorn. If personality is an unbroken series of successful gestures, then there was something gorgeous about him, some heightened sensitivity to the promises of life, as if he were related to one of those intricate machines that register earthquakes ten thousand miles away.

It was an extraordinary gift for hope, a romantic readiness such as I have never found in any other person and which it is not likely I shall ever find again. No—Gatsby turned out all right at the end; it is what preyed on Gatsby, what foul dust floated in the wake of his dreams that temporarily closed out my interest in the abortive sorrows and short-winded elations of men.`,
      },
    ],
  },
  {
    id: "book-7",
    slug: "bhagavad-gita-philosophy",
    title: "The Bhagavad Gita: Song of the Divine",
    author: "Sage Vyasa / Commentary by S. Radhakrishnan",
    description:
      "The eternal dialogue between Prince Arjuna and Lord Krishna on the battlefield of Kurukshetra. Touching upon duty, action without attachment (Nishkama Karma), knowledge, and devotion, it remains one of humankind's sublime spiritual guides.",
    coverUrl: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=800",
    format: "interactive",
    isbn: "978-8172230876",
    language: "English",
    categoryId: "cat-philosophy",
    categoryName: "Philosophy & Religion",
    tags: ["Spirituality", "Eastern Philosophy", "Yoga", "Classic"],
    publisher: "HarperCollins",
    publicationDate: "1948-11-01",
    pages: 350,
    featured: true,
    trending: false,
    popular: true,
    status: "published",
    rating: 4.96,
    ratingCount: 2450,
    readCount: 8900,
    fileSize: "1.8 MB",
    createdAt: "2024-01-01T00:00:00Z",
    sampleContent:
      "You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty.",
    tableOfContents: [
      { title: "Chapter 1: Arjuna Vishada Yoga", page: 1 },
      { title: "Chapter 2: Sankhya Yoga — The Yoga of Knowledge", page: 28 },
      { title: "Chapter 3: Karma Yoga — The Yoga of Action", page: 62 },
      { title: "Chapter 4: Jnana Karma Sanyasa Yoga", page: 94 },
    ],
    chapters: [
      {
        id: "bg-ch2",
        title: "Chapter 2: Sankhya Yoga — The Yoga of Knowledge",
        page: 28,
        content: `Dhritarashtra said: On the holy plain of Kurukshetra, when my sons and the sons of Pandu gathered eager for battle, what did they do, O Sanjaya?

Sanjaya described the mighty armies facing each other with conches sounding and standards raised high. But seeing his kinsmen, teachers, grandfathers, and cousins poised for mutual slaughter, Prince Arjuna's heart sank into sorrow and his bow Gandiva slipped from his trembling hands.

Seeing Arjuna overcome with grief, his eyes full of tears, Lord Krishna spoke these words:

"Whence has this dejection come upon you in this hour of trial? It is not worthy of an honorable person; it leads neither to heaven nor to honor on earth. Shake off this faint-heartedness and arise, scorcher of enemies!"

Arjuna answered: "How can I strike Bhishma and Drona with arrows in battle, who are worthy of my reverence? It were better to live on alms in this world than to slay these great-souled teachers."

Krishna smiled gently and taught him the mystery of eternity:
"You grieve for those who need not be grieved for, yet you speak words of wisdom. The truly wise mourn neither for the living nor for the dead.

Never was there a time when I did not exist, nor you, nor all these kings; nor in the future shall any of us cease to be.

Just as the embodied soul passes through childhood, youth, and old age in this body, so does it pass into another body. The wise are not deluded by this.

The unreal has no existence, and the real never ceases to be. The eternal truth of both has been perceived by the seers of reality.

Know that that which pervades all this universe is indestructible. None can cause the destruction of the imperishable soul.

Weapons cannot cut it, fire cannot burn it, water cannot wet it, nor can the wind wither it. It is eternal, all-pervading, unmoving, immovable, and everlasting.

Therefore, do your duty without attachment. You have a right to your actions, but never to the fruits thereof."`,
      },
    ],
  },
  {
    id: "book-8",
    slug: "clean-code-robert-martin",
    title: "Clean Code",
    author: "Robert C. Martin",
    description:
      "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Master software engineer 'Uncle Bob' presents a revolutionary paradigm with best practices of writing, reading, and refactoring clean code.",
    coverUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
    format: "interactive",
    isbn: "978-0132350884",
    language: "English",
    categoryId: "cat-technology",
    categoryName: "Technology",
    tags: ["Programming", "Software Engineering", "Architecture", "Design Patterns"],
    publisher: "Prentice Hall",
    publicationDate: "2008-08-01",
    pages: 464,
    featured: false,
    trending: true,
    popular: true,
    status: "published",
    rating: 4.83,
    ratingCount: 1120,
    readCount: 4670,
    fileSize: "3.1 MB",
    createdAt: "2024-02-18T00:00:00Z",
    sampleContent:
      "The only valid measurement of code quality is WTFs per minute. Writing clean code is what you must do if you want to call yourself a professional. There is no excuse for doing anything less than your best.",
    tableOfContents: [
      { title: "Chapter 1: Clean Code", page: 1 },
      { title: "Chapter 2: Meaningful Names", page: 17 },
      { title: "Chapter 3: Functions", page: 39 },
      { title: "Chapter 4: Comments", page: 67 },
    ],
    chapters: [
      {
        id: "cc-ch1",
        title: "Chapter 1: Clean Code",
        page: 1,
        content: `You are reading this book for two reasons. First, you are a programmer. Second, you want to be a better programmer. Good. We need better programmers.

This book is about good programming. It is filled with code. We are going to look at code from every angle: from the top down, from the bottom up, and from the inside out. By the time we are done, we will know the difference between good code and bad code. We will know how to write good code. And we will know how to transform bad code into good code.

Have you ever been significantly impeded by bad code? If you are a programmer of any experience, you have felt this impediment many times. Indeed, we have a name for it: wading. We wade through bad code. We slog through a morass of tangled brambles and hidden pitfalls. We struggle to find our way, hoping for some clue of what is going on.

Why did you write bad code? Were you trying to go fast? Were you in a rush? Probably. You felt you didn't have time to do a good job; your boss would be angry if you took the time to clean up. But the truth is: you will never be faster than when you take the time to keep your code clean.

The Boy Scout Rule:
"Leave the campground cleaner than you found it."

If we all checked in our code a little cleaner than when we checked it out, the code simply could not rot. The cleanup doesn't have to be big. Change one variable name for the better, break up one function that's a little too large, eliminate one little bit of duplication.`,
      },
    ],
  },
];
