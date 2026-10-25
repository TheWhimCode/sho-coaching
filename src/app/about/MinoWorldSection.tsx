"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { TWITCH_CHANNEL_URL } from "@/lib/twitch/channel";
import styles from "./MinoWorldSection.module.css";

// Public media URLs keep the showcase independent of the database.
const TOPICS = [
  {
    id: "model", label: "My VTuber model", category: "Learning to bring Mino to life",
    photos: [
      "https://videos.its-mino.com/about/model/MinoTopology.png",
      "https://videos.its-mino.com/about/model/MinoArmWeights.png",
      "https://videos.its-mino.com/about/model/MinoHeadPat.png",
    ],
    title: "Creating my own VTuber model",
    description: "Getting your own model is super expensive, so I decided to learn how to do it myself. That way I have full creative freedom, but it's also a ton of work.\n\nI'm learning how to use Blender, Unity and Warudo to bring Mino to life in his cutest form.",
    note: "Just making things one by one :3",
    captions: ["trying to figure out topology", "setting up weights", "one piece at a time"],
    alts: ["Mino VTuber model topology", "Arm weights on Mino's VTuber model", "Mino's VTuber model headpat setup"],
    link: { label: "Come hang out while I create", href: TWITCH_CHANNEL_URL },
  },
  {
    id: "content", label: "Content Creation", category: "Streaming, creating & growing",
    title: "Growing the Mino Empire",
    description: "My main goal is to grow my Twitch audience to eventually sustain myself via streaming League or variety. I'm trying to be active on TikTok and Reddit for growth (Youtube isn't currently an option for me).\n\nSince I have a substantial coaching background, I try to blend educational content with being a silly femboy VTuber. I can never tell if it's working 😭",
    note: "I've got so many ideas that I want to show you!!",
    photos: [
      "https://videos.its-mino.com/about/content/Filmora.png",
      "https://videos.its-mino.com/about/content/Coaching.png",
    ],
    captions: ["bringing ideas to life", "sharing what I've learned"],
    alts: ["Mino editing content in Filmora", "Mino's coaching content"],
    link: { label: "Come be part of it on Twitch", href: TWITCH_CHANNEL_URL },
  },
  {
    id: "style", label: "I'm a femboy!!", category: "A little ray of light",
    photos: [
      "https://videos.its-mino.com/about/femboy/blueSkirt2.jpg",
      "https://videos.its-mino.com/about/femboy/whiteSkirt.jpg",
      "https://videos.its-mino.com/about/femboy/pinkSkirt.jpg",
    ],
    title: "All I want is to be cute",
    description: "If I can be a little ray of light that makes your day just a tiny bit better, I'm happy. Often life can feel incredibly tough, crushing. I want to show people that it's not all bad, by becoming as adorable and kind as I can.\n\nAnd expressing that physically plays a part in that. White & pastel colors are my favorites <3",
    note: "Still learning how to do basic photography though...",
    captions: ["feeling like myself", "a little white", "a little pink"],
    alts: ["Mino wearing a blue skirt", "Mino wearing a white skirt", "Mino wearing a pink skirt"],
    link: { label: "Find this side of me on Twitter", href: "https://x.com/itsMinooooo_" },
  },
  {
    id: "kitchen", label: "I also cook :3", category: "Eating well, even on busy days",
    photos: [
      "https://studio.its-mino.com/recipes/carbonara.jpg",
      "https://studio.its-mino.com/recipes/cauli.jpg",
      "https://studio.its-mino.com/recipes/tiramisu.jpg",
    ],
    title: "I really love yummy food",
    description: "But I also want to eat healthy and control my diet! So the best way is cooking for myself as much as I can.\n\nOften I don't have the energy or time though, so I've got a lot of super awesome quick recipes and mealprep ideas to keep me consistent.",
    note: "I'm literally boywife maxxing blehh",
    captions: ["carbonara", "coconut curry", "a little tiramisu"],
    alts: ["Carbonara from Mino's recipe collection", "Cauliflower coconut tofu curry from Mino's recipe collection", "Tiramisu from Mino's recipe collection"],
    link: null,
  },
  {
    id: "challenger", label: "SoloQ climb", category: "Finding balance on the climb",
    photos: [],
    title: "Retraining Challenger",
    description: "I've hit Challenger many times, but haven't been able to retain it through-out the season. The game has always stressed me out way too much, so if I play every day I get drained and start playing terribly.\n\nBecause I'm so inconsistent, my main goal has been to only play on good days. But it's difficult, especially on-stream.",
    note: "Trying to find a balance, only playing every second day.",
    captions: [],
    alts: [],
    link: { label: "Follow the climb on Twitch", href: TWITCH_CHANNEL_URL },
  },
] as const;

function ShowcasePhoto({ photo, caption, alt, className }: {
  photo: string; caption: string; alt: string; className: string;
}) {
  return (
    <figure className={`${styles.photo} ${className}`}>
      <div className={styles.photoImage}>
        <Image src={photo} alt={alt} fill
          sizes="(max-width: 640px) 75vw, (max-width: 900px) 38vw, 550px" />
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export default function MinoWorldSection() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "0px 0px -64px 0px" });
  const topic = TOPICS[active];
  const visible = inView || !!reducedMotion;
  const ease = [0.22, 1, 0.36, 1] as const;
  const entrance = (delay: number) => ({
    initial: { opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 28 },
    animate: { opacity: visible ? 1 : 0, y: visible ? 0 : 28 },
    transition: { duration: reducedMotion ? 0 : 0.65, delay: reducedMotion ? 0 : delay, ease },
  });

  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let index: number;
    if (event.key === "ArrowRight") index = (active + 1) % TOPICS.length;
    else if (event.key === "ArrowLeft") index = (active - 1 + TOPICS.length) % TOPICS.length;
    else if (event.key === "Home") index = 0;
    else if (event.key === "End") index = TOPICS.length - 1;
    else return;
    event.preventDefault();
    setActive(index);
    tabRefs.current[index]?.focus();
  }

  return (
    <section ref={sectionRef} id="my-world" className={styles.section} aria-labelledby="mino-world-heading">
      <motion.div aria-hidden="true" className={styles.background}
        initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 72 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 72 }}
        transition={{ duration: reducedMotion ? 0 : 0.9, ease }} />
      <div className={styles.inner}>
        <motion.header className={styles.header} {...entrance(0.15)}>
          <div>
            <p className={styles.eyebrow}>Who I am</p>
            <h2 id="mino-world-heading">What occupies my mind right now?</h2>
          </div>
        </motion.header>

        <motion.div className={styles.tabs} role="tablist" aria-label="Explore Mino's interests" onKeyDown={onTabKeyDown} {...entrance(0.28)}>
          {TOPICS.map((entry, index) => (
            <button key={entry.id} ref={(element) => { tabRefs.current[index] = element; }}
              type="button" role="tab" id={`mino-world-tab-${entry.id}`} aria-controls="mino-world-panel"
              aria-selected={active === index} tabIndex={active === index ? 0 : -1}
              className={styles.tab} onClick={() => setActive(index)}>
              <span className={styles.tabNumber}>0{index + 1}</span><span>{entry.label}</span>
            </button>
          ))}
        </motion.div>

        <motion.div id="mino-world-panel" role="tabpanel" aria-labelledby={`mino-world-tab-${topic.id}`} tabIndex={0} className={styles.panel} {...entrance(0.42)}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={topic.id} className={`${styles.content} ${topic.photos.length === 0 ? styles.withoutGallery : ""}`}
              initial="hidden" animate={visible ? "visible" : "hidden"} exit="exit"
              variants={{ hidden: { opacity: reducedMotion ? 1 : 0 }, visible: { opacity: 1, transition: { staggerChildren: reducedMotion ? 0 : 0.12 } }, exit: { opacity: reducedMotion ? 1 : 0, transition: { duration: reducedMotion ? 0 : 0.15 } } }}>
              <motion.div className={styles.story} variants={{ hidden: { opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 24 }, visible: { opacity: 1, y: 0, transition: { duration: reducedMotion ? 0 : 0.55, ease } } }}>
                <p className={styles.category}>{topic.category}</p>
                <h3>{topic.title}</h3>
                <div className={styles.description}>
                  {topic.description.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                <p className={styles.personalNote}>{topic.note}</p>
                {topic.link && <a className={styles.link} href={topic.link.href} target="_blank" rel="noopener noreferrer">
                  {topic.link.label}<ArrowUpRight size={17} aria-hidden="true" />
                </a>}
              </motion.div>
              {topic.photos.length > 0 && <motion.div className={styles.gallery} aria-label={`${topic.label} photo gallery`} variants={{ hidden: { opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 36 }, visible: { opacity: 1, y: 0, transition: { duration: reducedMotion ? 0 : 0.65, ease } } }}>
                {topic.photos.map((photo, index) => <ShowcasePhoto key={photo} photo={photo}
                  caption={topic.captions[index]} alt={topic.alts[index]}
                  className={index === 0 ? styles.mainPhoto : index === 2 || topic.photos.length === 2 ? styles.smallPhoto : styles.detailPhoto} />)}
              </motion.div>}
            </motion.div>
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
}
