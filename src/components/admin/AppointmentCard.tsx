"use client";

import { motion } from "framer-motion";
import {
  Phone,
  User,
  Clock,
  Scissors,
  CheckCircle,
  XCircle,
  Check,
  MessageCircle,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type {
  Appointment,
  Barber,
  Service,
  Profile,
} from "@/types/database.types";

export interface EnrichedAppointment extends Appointment {
  barberData?: Barber;
  serviceData?: Service;
  clientData?: Profile;
}

interface AppointmentCardProps {
  appointment: EnrichedAppointment;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onComplete?: (id: string) => void;
  onRequestRating?: (appointment: EnrichedAppointment) => void;
  onClick?: (appointment: EnrichedAppointment) => void;
  isNext?: boolean;
  showActions?: boolean;
  index?: number;
}

const statusConfig = {
  pending: {
    label: "En attente",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    dotColor: "bg-yellow-500",
  },
  confirmed: {
    label: "Confirmé",
    color: "bg-green-500/10 text-green-600 border-green-500/30",
    dotColor: "bg-green-500",
  },
  cancelled: {
    label: "Annulé",
    color: "bg-red-500/10 text-red-600 border-red-500/30",
    dotColor: "bg-red-500",
  },
  completed: {
    label: "Terminé",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    dotColor: "bg-blue-500",
  },
};

export function AppointmentCard({
  appointment,
  onConfirm,
  onCancel,
  onComplete,
  onRequestRating,
  onClick,
  isNext = false,
  showActions = true,
  index = 0,
}: AppointmentCardProps) {
  const status = statusConfig[appointment.status as keyof typeof statusConfig];
  const clientName = appointment.clientData?.full_name || "Client";
  const clientPhone = appointment.clientData?.phone;
  const serviceName = appointment.serviceData?.name || "Service";
  const barberName = appointment.barberData?.name || "Barbier";
  const serviceDuration = appointment.serviceData?.duration_minutes || 30;

  // Calculate time since created
  const createdAt = appointment.created_at;
  let timeAgo = "";
  try {
    const createdDate =
      typeof createdAt === "string" ? new Date(createdAt) : createdAt;
    timeAgo = formatDistanceToNow(createdDate, { addSuffix: true, locale: fr });
  } catch {
    timeAgo = "";
  }

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clientPhone) {
      window.location.href = `tel:${clientPhone}`;
    }
  };

  const handleSMS = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clientPhone) {
      window.location.href = `sms:${clientPhone}`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onClick?.(appointment)}
      className={cn(
        "bg-card border rounded-2xl p-4 cursor-pointer transition-all active:scale-[0.98]",
        isNext && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      {/* Next badge */}
      {isNext && (
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-xs font-medium text-primary">Prochain RDV</span>
        </div>
      )}

      {/* Header: Client info + status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{clientName}</p>
            {clientPhone && (
              <p className="text-xs text-muted-foreground">{clientPhone}</p>
            )}
          </div>
        </div>
        <Badge variant="outline" className={cn("text-xs", status?.color)}>
          <span
            className={cn("w-1.5 h-1.5 rounded-full mr-1.5", status?.dotColor)}
          ></span>
          {status?.label}
        </Badge>
      </div>

      {/* Service info */}
      <div className="mb-3">
        <p className="font-semibold text-lg">{serviceName}</p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Scissors className="w-3.5 h-3.5" />
            {barberName}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {serviceDuration} min
          </span>
        </div>
      </div>

      {/* Time slot */}
      <div className="flex items-center justify-between mb-3 p-3 bg-accent/50 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <span className="text-2xl font-bold text-primary">
              {appointment.start_time}
            </span>
          </div>
          <span className="text-muted-foreground">→</span>
          <span className="text-lg font-medium">{appointment.end_time}</span>
        </div>
        {timeAgo && (
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        )}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="flex gap-2">
          {appointment.status === "pending" && (
            <>
              <Button
                size="sm"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onConfirm?.(appointment.id);
                }}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Confirmer
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel?.(appointment.id);
                }}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Annuler
              </Button>
            </>
          )}
          {appointment.status === "confirmed" && (
            <>
              <Button
                size="sm"
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete?.(appointment.id);
                }}
              >
                <Check className="w-4 h-4 mr-1" />
                Terminer
              </Button>
              {clientPhone && (
                <>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9"
                    onClick={handleCall}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9"
                    onClick={handleSMS}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </>
              )}
            </>
          )}
          {appointment.status === "completed" && (
            <div className="flex gap-2 w-full">
              <Button
                size="sm"
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestRating?.(appointment);
                }}
              >
                <Star className="w-4 h-4 mr-1" />
                Demander avis
              </Button>
              {clientPhone && (
                <>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9"
                    onClick={handleCall}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9"
                    onClick={handleSMS}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          )}
          {appointment.status === "cancelled" && clientPhone && (
            <div className="flex gap-2 w-full">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={handleCall}
              >
                <Phone className="w-4 h-4 mr-1" />
                Appeler
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={handleSMS}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                SMS
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
