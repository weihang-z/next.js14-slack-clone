import { atom, useAtom } from "jotai";

const modalAtom = atom(false);

export const useCreateChanneleModal = () => {
  return useAtom(modalAtom);
};
