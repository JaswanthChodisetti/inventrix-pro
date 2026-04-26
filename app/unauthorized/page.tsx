"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Lock, ArrowLeft, Home } from "lucide-react"

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center"
      >
        {/* Lock Icon */}
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 flex justify-center"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
            <Lock className="h-12 w-12 text-destructive" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-2 text-3xl font-bold"
        >
          Access Denied
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8 text-muted-foreground"
        >
          You don&apos;t have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col gap-3 sm:flex-row sm:justify-center"
        >
          <Button onClick={() => router.back()} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={() => router.push("/dashboard")} className="gap-2">
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </motion.div>

        {/* Role Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 rounded-lg bg-muted p-4 text-sm"
        >
          <p className="font-medium">Permission Levels:</p>
          <ul className="mt-2 space-y-1 text-left text-muted-foreground">
            <li>
              <span className="font-medium text-primary">Viewer:</span> View
              dashboard and reports
            </li>
            <li>
              <span className="font-medium text-primary">Manager:</span> Edit
              products, categories, and transactions
            </li>
            <li>
              <span className="font-medium text-primary">Admin:</span> Full
              access including user management
            </li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  )
}
