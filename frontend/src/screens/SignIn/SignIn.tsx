import { EyeIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/lable";
import type { JSX } from "react";

export const SignIn = (): JSX.Element => {
  return (
    <div className="bg-white overflow-hidden w-full min-w-[1440px] h-screen flex">
      <div className="w-1/2 relative bg-gradient-to-br from-[#7b76f1] via-[#9b6fd9] to-[#c96bc6] flex flex-col items-center justify-between py-20 px-16 gap-6">
        <div className="flex justify-center gap-3 self-start w-full">
          <img src="/codesquidLogo.png" alt="Logo" className="w-[233px] h-[60px]"/>
        </div>

        <div className="flex flex-col items-center gap-12">
          <img
            className="w-[423px] h-[357px]"
            alt="Illustration"
            src="/illustration.png"
          />

          <div className="flex flex-col items-center gap-4">
            <h2 className="[font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-bold text-white text-[31.2px] text-center tracking-[-0.50px] leading-[37.5px]">
              Production Operations eXtended
            </h2>
            <p className="[font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-normal text-neutral-100 text-[25px] text-center tracking-[0] leading-[28.2px]">
              Welcome
            </p>
          </div>
        </div>

        <div className="h-20" />
      </div>

      <div className="w-1/2 flex flex-col items-center justify-start pt-[150px] px-16">
        <div className="w-full max-w-[500px] flex flex-col items-center gap-12">
          <h1 className="[font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-bold text-[#242424] text-[31.2px] text-center tracking-[-0.50px] leading-[37.5px]">
            Welcome back to the <br />
            Production Operations eXtended
          </h1>

          <div className="w-full max-w-[380px] flex flex-col gap-6">
            <div className="flex flex-col gap-6">
              <div className="relative flex flex-col gap-2">
                <Label
                  htmlFor="email"
                  className="[font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-normal text-[#757575] text-[12.8px] tracking-[0] leading-[22.5px]"
                >
                  Email or Username
                </Label>
                <Input
                  id="email"
                  type="text"
                  defaultValue="phanphuclam@prodopsx.com"
                  className="[font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-normal text-[#212121] text-base tracking-[0] leading-[28.2px] border-0 border-b border-[#e0e0e0] rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#7b76f1]"
                />
              </div>

              <div className="relative flex flex-col gap-2">
                <Label
                  htmlFor="password"
                  className="[font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-normal text-[#757575] text-[12.8px] tracking-[0] leading-[22.5px]"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    defaultValue="**************"
                    className="[font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-normal text-[#424242] text-base tracking-[0] leading-[28.2px] border-0 border-b border-[#e0e0e0] rounded-none px-0 pr-8 focus-visible:ring-0 focus-visible:border-[#7b76f1]"
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[#757575] hover:text-[#424242]"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" className="cursor-pointer"/>
                <Label
                  htmlFor="remember"
                  className="[font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-normal text-[#757575] text-[10.2px] tracking-[0] leading-[22.5px] cursor-pointer"
                >
                  Remember me
                </Label>
              </div>

              <Button className="bg-[#7b76f1] hover:bg-[#6b66e1] text-white [font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-bold text-[12.8px] tracking-[0] 
                leading-[22.5px] rounded-[56px] shadow-[0px_34px_40px_-8px_#7b76f13d] h-14 px-12 cursor-pointer">
                LOG IN
              </Button>
            </div>
          </div>

          <div className="[font-family:'Zen_Kaku_Gothic_Antique',Helvetica] font-normal text-[#424242] text-[12.8px] text-center tracking-[0] leading-[normal]">
            No Account yet?{" "}
            <button className="font-bold text-[#212121] underline hover:text-[#7b76f1] cursor-pointer">
              SIGN UP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};