import { motion } from "framer-motion";

type Props = {
  youtubeUrl: string;
  className?: string; // allow parent to size/align
};

export default function SessionExample({ youtubeUrl, className }: Props) {
  return (
    <motion.div
      className={`w-full aspect-video rounded-xl overflow-hidden ring-1 ring-white/10 bg-black/30 ${className ?? ""}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
    >
      <iframe
        className="w-full h-full"
        src={youtubeUrl}
        title="Example session video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </motion.div>
  );
}
