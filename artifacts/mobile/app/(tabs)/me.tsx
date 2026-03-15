import { router } from "expo-router";
import { useEffect } from "react";
import { auth } from "@/context/AppContext";

export default function MeTab() {
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      router.replace(`/profile/${user.uid}`);
    } else {
      router.replace("/auth");
    }
  }, []);

  return null;
}
