"use client"

import { AppLayout } from "@/components/layout/AppLayout"
import { useAppStore } from "@/store/useAppStore"
import { InputForm } from "@/components/steps/InputForm"
import { ResearchDashboard } from "@/components/steps/ResearchDashboard"
import { DebateRoom } from "@/components/steps/DebateRoom"
import { FinalPRD } from "@/components/steps/FinalPRD"
import { VersionDashboard } from "@/components/steps/VersionDashboard"
import { ReviewDashboard } from "@/components/steps/ReviewDashboard"
import { KnowledgeDashboard } from "@/components/steps/KnowledgeDashboard"
import { PlanningDashboard } from "@/components/steps/PlanningDashboard"
import { DeliveryDashboard } from "@/components/steps/DeliveryDashboard"
import { IntegrationDashboard } from "@/components/steps/IntegrationDashboard"
import { ExportDashboard } from "@/components/steps/ExportDashboard"
import { IntelligenceDashboard } from "@/components/steps/IntelligenceDashboard"

export default function Home() {
  const { currentStep } = useAppStore()

  return (
    <AppLayout>
      {currentStep === 'input' && <InputForm />}
      {currentStep === 'research' && <ResearchDashboard />}
      {currentStep === 'debate' && <DebateRoom />}
      {currentStep === 'prd' && <FinalPRD />}
      {currentStep === 'intelligence' && <IntelligenceDashboard />}
      {currentStep === 'export' && <ExportDashboard />}
      {currentStep === 'versions' && <VersionDashboard />}
      {currentStep === 'review' && <ReviewDashboard />}
      {currentStep === 'knowledge' && <KnowledgeDashboard />}
      {currentStep === 'planning' && <PlanningDashboard />}
      {currentStep === 'delivery' && <DeliveryDashboard />}
      {currentStep === 'integrations' && <IntegrationDashboard />}
    </AppLayout>
  )
}
