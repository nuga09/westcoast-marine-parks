export type DailyMessageDTO = {
  message: string;
  launchStartTime: string | null;
  retrievalStartTime: string | null;
  updatedAt: string | null;
};

export type QueueBookingCustomerDTO = {
  id: string;
  requestedAt: string;
  completedAt: string | null;
  stayingOnMooring: boolean;
  vessel: {
    id: string;
    yardNumber: string | null;
  };
};

export type QueueBookingAdminDTO = {
  id: string;
  requestedAt: string;
  completedAt: string | null;
  stayingOnMooring: boolean;
  vessel: {
    id: string;
    yardNumber: string | null;
    boatName: string;
    boatNumber: string;
    owner: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    };
  };
};

export type QueueResponseCustomerDTO = {
  serviceDate: string;
  dailyMessage: DailyMessageDTO;
  pending: QueueBookingCustomerDTO[];
  completed: QueueBookingCustomerDTO[];
  counts: { pending: number; completed: number };
};

export type QueueResponseAdminDTO = {
  serviceDate: string;
  dailyMessage: DailyMessageDTO;
  pending: QueueBookingAdminDTO[];
  completed: QueueBookingAdminDTO[];
  counts: { pending: number; completed: number };
};

