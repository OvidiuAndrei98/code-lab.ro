import Image from "next/image";
import BackgroundImage from "@/public/background svg.svg";

export default function Home() {
  return (
    <div className="w-full p-0 h-full bg-black">
      <Image
        className="z-0 object-cover p-0  w-full h-full  "
        src={BackgroundImage}
        alt="bg-img"
      />
    </div>
  );
}
