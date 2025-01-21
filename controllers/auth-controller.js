const { User } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

exports.register = async (req, res) => {
  const { username, email, password, age, sex, isPublicProfile } = req.body;

  try {
    const existingUser = await User.findOne({
      where: { email: email, username: username },
    });
    if (existingUser)
      return res.status(400).json({ message: "Credential already in use" });

    const user = await User.create({
      username,
      email,
      password,
      age,
      sex,
      isPublicProfile,
    });
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user.id, username, email, age, sex, isPublicProfile },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !user.validPassword(password)) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user);
    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email,
        age: user.age,
        sex: user.sex,
        isPublicProfile: user.isPublicProfile,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get authenticated user's profile
exports.getProfile = async (req, res) => {
  const user = req.user;

  res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email,
    age: user.age,
    sex: user.sex,
    isPublicProfile: user.isPublicProfile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
};

// Update authenticated user's profile
exports.updateProfile = async (req, res) => {
  const user = req.user;
  const { username, email, password, age, sex, isPublicProfile } = req.body;

  try {
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail)
        return res.status(400).json({ message: "Email already in use" });
    }

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername)
        return res.status(400).json({ message: "Username already in use" });
    }

    await user.update({ username, email, password, age, sex, isPublicProfile });
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Logout user (Optional: Since JWT is stateless, you might handle this on the client-side)
exports.logout = (req, res) => {
  // For stateless JWT, logout can be handled by the client by deleting the token.
  res.status(200).json({ message: "Logged out successfully" });
};
