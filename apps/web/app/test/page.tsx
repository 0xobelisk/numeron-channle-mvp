'use client';

import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    ChevronDown,
    Github,
    Grid,
  } from "lucide-react";
  import React, { useEffect, useState } from "react";
  
  import { Badge } from "@workspace/ui/components/badge";
  import { Button } from "@workspace/ui/components/button";
  import { Card, CardContent } from "@workspace/ui/components/card";
  import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
  } from "@workspace/ui/components/navigation-menu";
  import { Separator } from "@workspace/ui/components/separator";
  
  // 创建一个简单的占位符组件替代外部图片
  const PlaceholderImage = ({ width, height, text, className = "" }) => (
    <div 
      className={`flex items-center justify-center bg-gray-700 text-white ${className}`}
      style={{ width, height }}
    >
      {text}
    </div>
  );
  
  export default function TestPage() {
    // 添加客户端渲染状态
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
      setMounted(true);
    }, []);
    
    // Game comparison data
    const gameTypes = [
      {
        title: "CENTRALIZED GAMES",
        icon: (
          <PlaceholderImage 
            width="69px" 
            height="69px" 
            text="中心化" 
            className="mx-auto"
          />
        ),
        features: ["Off Chain", "Legal Company", "Content First", "Play For Fun"],
        bulletColor: "bg-[#ff3370]",
      },
      {
        title: "INTENT-CENTRIC GAMES",
        icon: <PlaceholderImage width="99px" height="99px" text="意图中心" className="mx-auto" />,
        features: [
          "Fully On Chain",
          "Autonomous",
          "Intent First",
          "Play In World",
        ],
        bulletColor: "bg-[#83eb47]",
        bulletShadow: "shadow-[0px_0px_7.1px_#69c236]",
        isFeatured: true,
      },
      {
        title: "DECENTRALIZED GAMES",
        icon: <Grid className="w-[76px] h-[76px] mx-auto text-white" />,
        features: ["On Chain", "Foundation/dao", "Assets First", "Play To Earn"],
        bulletColor: "bg-[#ff3370]",
      },
    ];
  
    // Support partners data
    const partners = [
      { name: "Obelisk Labs", logo: "https://placehold.co/300x200", width: "123px", height: "30px" },
      { name: "Partner 2", logo: "https://placehold.co/300x200", width: "48px", height: "25px" },
      { name: "Partner 3", logo: "https://placehold.co/300x200", width: "78px", height: "23px" },
      { name: "Partner 4", logo: "https://placehold.co/300x200", width: "82px", height: "21px" },
    ];
  
    // Social media links
    const socialLinks = [
      {
        icon: <img src="https://placehold.co/300x200" alt="Twitter" className="w-[22px] h-[22px]" />,
        url: "#",
      },
      { icon: <Github className="w-[29px] h-[29px] text-[#ffeaa7]" />, url: "#" },
      {
        icon: <img src="https://placehold.co/300x200" alt="Telegram" className="w-[29px] h-[29px]" />,
        url: "#",
      },
      {
        icon: <img src="https://placehold.co/300x200" alt="Discord" className="w-[29px] h-[29px]" />,
        url: "#",
      },
    ];
  
    return (
      <div className="bg-white flex flex-row justify-center w-full">
        <div className="bg-white overflow-hidden w-full max-w-[1440px] relative">
          {/* Main background */}
          <div className="absolute w-full h-[3238px] top-0 left-0 [background:linear-gradient(180deg,rgba(0,7,14,1)_0%,rgba(3,15,28,1)_100%)]">
            {/* Glow effects */}
            <div className="absolute w-[408px] h-[374px] top-[2452px] left-1/2 -translate-x-1/2 bg-[#ac9ef469] rounded-[204px/187px] blur-[87.7px]" />
            <div className="absolute w-[403px] h-[261px] top-[1096px] left-1/2 -translate-x-1/2 bg-[#ac9ef469] rounded-[20px] blur-[87.7px]" />
            <div className="absolute w-[403px] h-[392px] top-[1566px] left-1/2 -translate-x-1/2 bg-[#ac9ef469] rounded-[20px] blur-[87.7px]" />
            <div className="absolute w-[263px] h-[67px] top-[2017px] left-1/2 -translate-x-1/2 bg-[#ac9ef469] rounded-[20px] blur-[87.7px]" />
            <div className="absolute w-[1527px] h-[490px] top-[267px] left-1/2 -translate-x-1/2 bg-[#ac9ef46b] rounded-[30px] rotate-[-2.59deg] blur-[113.85px]" />
  
            {/* Hero section background */}
            <img
              className="absolute w-full h-[586px] top-[113px] left-0 mix-blend-screen object-cover"
              alt="Hero background"
              src="https://placehold.co/300x200"
            />
            <div className="absolute w-[1322px] h-[472px] top-[231px] left-1/2 -translate-x-1/2 bg-[#251f4a] rounded-[30px] border border-solid border-[#939ba3] rotate-[-4.40deg]" />
            <div className="absolute w-[1318px] h-[494px] top-[215px] left-1/2 -translate-x-1/2 bg-[#113152] rounded-[27px] border border-solid border-[#bcc3ff] shadow-[0px_0px_34px_#ac9ef473]" />
  
            {/* Navigation bar */}
            <header className="absolute w-[1316px] h-10 top-[150px] left-1/2 -translate-x-1/2 bg-[#45446b] rounded-[30px] overflow-hidden shadow-[0px_4px_6.2px_3px_#32323240] backdrop-blur-[10.95px] z-10">
              <NavigationMenu className="max-w-none w-full h-full">
                <NavigationMenuList className="h-full flex items-center justify-between px-3">
                  <NavigationMenuItem>
                    <div className="flex items-center h-full">
                      <div className="w-28 relative">
                        <div className="w-28 h-[27px] absolute top-[11px] bg-[#b7849d] blur-[23.1px] rounded-[20px]" />
                        <div className="w-[89px] h-[13px] relative">
                          <img src="https://placehold.co/300x200" alt="Numeron" className="h-[13px] w-auto" />
                        </div>
                      </div>
                    </div>
                  </NavigationMenuItem>
  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center text-[#ffeaa7] text-[13px] font-light">
                      COMMUNITY
                      <ChevronDown className="h-3 w-6 ml-1" />
                    </div>
  
                    <div className="flex items-center text-[#ffeaa7] text-[13px] font-light">
                      ABOUT
                      <ChevronDown className="h-3 w-6 ml-1" />
                    </div>
  
                    <Button className="h-[30px] w-[134px] bg-[#ffeaa7] rounded-[30px] text-black shadow-[0px_4px_23.4px_3px_#ffffff4c]">
                      <img src="https://placehold.co/300x200" alt="Frame" className="w-[37px] h-[19px]" />
                    </Button>
                  </div>
                </NavigationMenuList>
              </NavigationMenu>
            </header>
  
            {/* Hero section content */}
            <section className="absolute top-[400px] left-1/2 -translate-x-1/2 flex flex-col items-center">
              <Button className="w-[139px] h-10 bg-[#ffffffab] rounded-[30px] shadow-[0px_4px_23.4px_3px_#ffffff4c] backdrop-blur-[8.75px] text-transparent bg-gradient-to-t from-[rgba(212,175,55,1)] to-[rgba(255,234,167,1)] bg-clip-text">
                View Game
              </Button>
  
              <h1 className="mt-[150px] text-white text-[40px] font-normal text-center [text-shadow:0px_4px_4px_#00000040] [font-family:'Century_Gothic_Paneuropean-Regular',Helvetica]">
                USER INTENT-CENTRIC GAME WORLD
              </h1>
  
              <div className="mt-6 text-[#ffeaa7] text-xs text-center">
                Support By
              </div>
  
              <div className="flex items-center gap-[26px] mt-4">
                {partners.map((partner, index) => (
                  <div
                    key={index}
                    className="relative"
                    style={{ width: partner.width, height: partner.height }}
                  >
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
  
              <div className="mt-4 text-[#ffeaa7] text-xs text-center">
                Build On
              </div>
  
              <img src="https://placehold.co/300x200" alt="Platform" className="w-28 h-[27px] mt-2" />
            </section>
  
            {/* Games section */}
            <section className="absolute top-[1042px] left-0 w-full">
              <h2 className="text-[#ffeaa7] text-xl font-normal text-center [text-shadow:0px_4px_4px_#00000040] [font-family:'Century_Gothic_Paneuropean-Regular',Helvetica]">
                ALL Data
              </h2>
  
              <div className="relative mt-10 flex justify-center">
                <Button
                  variant="ghost"
                  className="absolute left-[184px] top-1/2 -translate-y-1/2 p-0 z-10"
                >
                  <ArrowLeft className="w-[15px] h-[23px] text-white" />
                </Button>
  
                <div className="flex gap-6 justify-center">
                  <Card className="w-[293px] h-[209px] bg-[#08192c] border-none rounded-[20px] overflow-hidden relative">
                    <div className="relative w-[403px] h-[298px] -top-10 left-[173px] bg-[#2e619969] rounded-[20px] blur-[87.7px]" />
                    <CardContent className="p-0"></CardContent>
                  </Card>
  
                  <Card className="w-[333px] h-[239px] bg-[#001328] border-[0.5px] border-solid border-[#bcc3ff] rounded-[20px] overflow-hidden relative">
                    <div className="relative w-[403px] h-[298px] top-[70px] left-[-42px] bg-[#2e619969] rounded-[20px] blur-[87.7px]" />
                    <Badge className="absolute top-[13px] left-[17px] w-[54px] h-4 bg-[#ffeaa7] text-[#251f4a] text-xs font-medium rounded-[30px] flex items-center justify-center">
                      BETA
                    </Badge>
                    <CardContent className="p-0"></CardContent>
                  </Card>
  
                  <Card className="w-[293px] h-[209px] bg-[#08192c] border-none rounded-[20px] overflow-hidden relative">
                    <div className="relative w-[403px] h-[298px] -top-[25px] left-[-249px] bg-[#2e619969] rounded-[20px] blur-[87.7px]" />
                    <CardContent className="p-0"></CardContent>
                  </Card>
                </div>
  
                <Button
                  variant="ghost"
                  className="absolute right-[184px] top-1/2 -translate-y-1/2 p-0 z-10"
                >
                  <ArrowRight className="w-[15px] h-[23px] text-white" />
                </Button>
              </div>
  
              <div className="flex justify-center mt-8">
                <Separator className="w-[433px] bg-white opacity-30" />
              </div>
            </section>
  
            {/* What's Intent-Centric Game section */}
            <section className="absolute top-[1522px] left-0 w-full">
              <h2 className="text-white text-2xl font-normal text-center [text-shadow:0px_4px_4px_#00000040] [font-family:'Century_Gothic_Paneuropean-Regular',Helvetica]">
                WHAT&apos;S INTENT-CENTRIC GAME
              </h2>
  
              <div className="flex justify-center gap-4 mt-12">
                {gameTypes.map((game, index) => (
                  <Card
                    key={index}
                    className={`w-[405px] h-[322px] bg-[#020b15] rounded-[20px] border-none shadow-[0px_8px_45.5px_#00000070] relative ${
                      game.isFeatured ? "overflow-hidden" : ""
                    }`}
                  >
                    {game.isFeatured && (
                      <div className="absolute w-[403px] h-[298px] top-[175px] left-0 bg-[#2e619969] rounded-[20px] blur-[87.7px]" />
                    )}
  
                    <CardContent className="flex flex-col items-center pt-5">
                      <div className="w-[117px] h-[117px] flex items-center justify-center">
                        {game.icon}
                      </div>
  
                      <h3
                        className={`mt-4 ${
                          game.isFeatured ? "text-2xl" : "text-xl"
                        } font-normal text-[#ffde75] text-center [text-shadow:0px_4px_4px_#00000040] [font-family:'Chill_Pixels-Maximal',Helvetica]`}
                      >
                        {game.title}
                      </h3>
  
                      <div className="flex flex-col items-start gap-1.5 mt-6">
                        {game.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <div
                              className={`w-3 h-3 ${game.bulletColor} rounded-md ${game.bulletShadow || ""}`}
                            />
                            <span className="text-[#ffde75] text-sm font-medium [font-family:'Noto_Sans_S_Chinese-Medium',Helvetica]">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
  
              <div className="mt-16 flex justify-center">
                <img
                  src="https://placehold.co/300x200"
                  alt="Intent centred games create a richer and more interactive gaming experience"
                  className="w-[932px] h-[51px]"
                />
              </div>
  
              <div className="mt-8 flex justify-center">
                <Button className="w-[230px] h-[34px] bg-[#2e6199] rounded-[42px] shadow-[0px_0px_11.5px_#2e6199] flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-white" />
                  <span className="text-white text-base font-light [font-family:'Noto_Sans_S_Chinese-DemiLight',Helvetica]">
                    Explanation Of Nouns
                  </span>
                </Button>
              </div>
            </section>
  
            {/* Intent-Centric Game World section */}
            <section className="absolute top-[2292px] left-0 w-full">
              <h2 className="text-white text-2xl font-normal text-center [text-shadow:0px_4px_4px_#00000040] [font-family:'Century_Gothic_Paneuropean-Regular',Helvetica]">
                INTENT-CENTRIC GAME WORLD
              </h2>
  
              <p className="mt-4 text-[#ffeaa7] text-base font-light text-center [font-family:'Noto_Sans_S_Chinese-Light',Helvetica]">
                &#34;world&#34; Serves As The Container For Intent-centric Spaces
                (ics), <br />
                where Each Ics Is Composed Of A Set Of Intent-centric Applications
                (ica).
              </p>
  
              <div className="mt-[100px] flex justify-center">
                <div className="w-[302px] h-[302px] relative">
                  <div className="w-[308px] h-[308px] absolute top-[-3px] left-[-3px] bg-[#112943] rounded-[154px] border-[3px] border-dashed border-[#ffeaa7]" />
                </div>
              </div>
            </section>
  
            {/* Footer */}
            <footer className="absolute w-full h-64 bottom-0 left-0 bg-[#020b15]">
              <div className="max-w-[1440px] h-full mx-auto relative">
                <div className="absolute top-[47px] left-[163px] w-[136px] h-5">
                  <img src="https://placehold.co/300x200" alt="Numeron" className="h-5 w-auto" />
                </div>
  
                <div className="absolute top-[147px] left-[163px] text-[#ffeaa7] text-[11px] font-light text-center [font-family:'Noto_Sans_S_Chinese-Light',Helvetica]">
                  © 2025 Numeron World Deck
                </div>
  
                <div className="absolute top-[145px] right-[163px] flex items-center gap-[22px]">
                  {socialLinks.map((link, index) => (
                    <a key={index} href={link.url} className="text-[#ffeaa7]">
                      {link.icon}
                    </a>
                  ))}
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    );
  }
  