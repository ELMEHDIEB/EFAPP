import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { MinusIcon } from "lucide-react"

function InputOTP({
  className,
  containerClassName,
  ...props
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "cn-input-otp flex items-center has-disabled:opacity-50",
        containerClassName
      )}
      spellCheck={false}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props} />
  );
}

function InputOTPGroup({
  className,
  ...props
}) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(
        "flex items-center gap-3",
        className
      )}
      {...props} />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      className={cn(
        "relative flex h-14 w-12 items-center justify-center rounded-md border text-2xl font-black shadow-[0_1px_2px_rgb(0,0,0,0.1)]",
        "bg-ink border-white/10 text-white", // Dark theme base
        isActive && "z-10",
        className
      )}
      {...props}>
      {isActive && (
        <motion.div
          layoutId="otp-glow-ring"
          className="absolute inset-0 rounded-md border-2 border-accent shadow-[inset_0_0_12px_rgba(34,211,238,0.6)] shadow-[0_0_12px_rgba(34,211,238,0.4)]"
          initial={{ scale: 1.05 }}
          animate={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      )}
      <div className="z-20 relative flex items-center justify-center">
        {char && <div className="w-3 h-3 rounded-full bg-white"></div>}
      </div>
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-white duration-1000" />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator({
  ...props
}) {
  return (
    <div
      data-slot="input-otp-separator"
      className="flex items-center [&_svg:not([class*='size-'])]:size-4"
      role="separator"
      {...props}>
      <MinusIcon />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
