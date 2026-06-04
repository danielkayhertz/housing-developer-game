import { AmiBand } from '../game/types';

const RENT_BY_AMI: Record<AmiBand, number> = {
  30: 625,
  60: 1_250,
  80: 1_665,
};

export function rentAtAmi(ami: AmiBand): number {
  return RENT_BY_AMI[ami];
}
