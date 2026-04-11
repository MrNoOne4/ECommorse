class UserService {
  static async findByEmail(email) {
    try {
      const response = await fetch("getUser.php?email=" + encodeURIComponent(email));
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const userData = await response.json();
      return userData.found ? userData.account : null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  }
}