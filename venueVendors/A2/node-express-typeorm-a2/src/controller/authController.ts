import { Request, Response } from "express";
import argon2 from "argon2";
import { AppDataSource } from "../data-source";
import { Hirer } from "../entity/hirerEntity";
import { Vendor } from "../entity/vendorEntity";

type LoginRole = "hirer" | "vendor";

interface PublicUser {
  id: number;
  name: string;
  email: string;
  role: LoginRole;
  phone?: string;
  comments: string;
  rating: number;
  requirements: string;
  approvalCount: number;
  dateJoined?: Date;
  venue?: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/;

const buildHirerResponse = (hirer: Hirer): PublicUser => ({
  id: hirer.id,
  name: hirer.name,
  email: hirer.email,
  role: "hirer",
  phone: hirer.phone,
  comments: hirer.comments,
  rating: hirer.rating,
  requirements: hirer.requirements,
  approvalCount: hirer.approvalCount,
  dateJoined: hirer.dateJoined,
});

const buildVendorResponse = (vendor: Vendor): PublicUser => ({
  id: vendor.id,
  name: vendor.name,
  email: vendor.email,
  role: "vendor",
  comments: "",
  rating: 0,
  requirements: "",
  approvalCount: 0,
  venue: vendor.venue,
});

async function findExistingAccount(email: string) {
  const hirerRepository = AppDataSource.getRepository(Hirer);
  const vendorRepository = AppDataSource.getRepository(Vendor);

  const [existingHirer, existingVendor] = await Promise.all([
    hirerRepository.findOneBy({ email }),
    vendorRepository.findOneBy({ email }),
  ]);

  return existingHirer || existingVendor;
}

export const signupUser = async (req: Request, res: Response) => {
  try {
    const { role, name, email, password, confirmPassword, phone } = req.body as {
      role?: LoginRole;
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      phone?: string;
    };

    if (role !== "hirer" && role !== "vendor") {
      return res.status(400).json({ message: "Please choose hirer or vendor." });
    }

    if (!name?.trim()) {
      return res.status(400).json({ message: "Name is required." });
    }

    if (!email?.trim()) {
      return res.status(400).json({ message: "Email is required." });
    }

    const normalisedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalisedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must have upper, lower, special character, and be at least 6 characters long.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const existingAccount = await findExistingAccount(normalisedEmail);

    if (existingAccount) {
      return res.status(409).json({
        message: "An account with that email already exists.",
      });
    }

    const hashedPassword = await argon2.hash(password);

    if (role === "hirer") {
      const hirerRepository = AppDataSource.getRepository(Hirer);
      const hirer = hirerRepository.create({
        name: name.trim(),
        email: normalisedEmail,
        password: hashedPassword,
        phone: phone?.trim() ?? "",
        comments: "",
        rating: 0,
        requirements: "",
        approvalCount: 0,
      });

      const savedHirer = await hirerRepository.save(hirer);

      return res.status(201).json({
        message: "Sign-up successful.",
        user: buildHirerResponse(savedHirer),
      });
    }

    const vendorRepository = AppDataSource.getRepository(Vendor);
    const vendor = vendorRepository.create({
      name: name.trim(),
      email: normalisedEmail,
      password: hashedPassword,
      venue: "",
    });

    const savedVendor = await vendorRepository.save(vendor);

    return res.status(201).json({
      message: "Sign-up successful.",
      user: buildVendorResponse(savedVendor),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to create account.",
      error,
    });
  }
};

export const signupHirer = signupUser;

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email?.trim()) {
      return res.status(400).json({ message: "Email is required." });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    const normalisedEmail = email.trim().toLowerCase();

    const hirerRepository = AppDataSource.getRepository(Hirer);
    const matchedHirer = await hirerRepository.findOneBy({
      email: normalisedEmail,
    });

    if (matchedHirer) {
      const validPassword = await argon2.verify(matchedHirer.password, password);

      if (!validPassword) {
        return res.status(401).json({ message: "Incorrect email or password." });
      }

      return res.json({
        message: `Welcome ${matchedHirer.name}`,
        user: buildHirerResponse(matchedHirer),
      });
    }

    const vendorRepository = AppDataSource.getRepository(Vendor);
    const matchedVendor = await vendorRepository.findOneBy({
      email: normalisedEmail,
    });

    if (matchedVendor) {
      const validPassword = await argon2.verify(matchedVendor.password, password);

      if (!validPassword) {
        return res.status(401).json({ message: "Incorrect email or password." });
      }

      return res.json({
        message: `Welcome ${matchedVendor.name}`,
        user: buildVendorResponse(matchedVendor),
      });
    }

    return res.status(401).json({ message: "Incorrect email or password." });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to process login.",
      error,
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const { role, id } = req.params as { role: string; id: string };

    if (!role || !id) {
      return res.status(400).json({ message: "Role and id are required." });
    }

    if (role === "hirer") {
      const hirerRepository = AppDataSource.getRepository(Hirer);
      const hirer = await hirerRepository.findOneBy({ id: Number(id) });

      if (!hirer) {
        return res.status(404).json({ message: "Hirer not found." });
      }

      return res.json(buildHirerResponse(hirer));
    }

    if (role === "vendor") {
      const vendorRepository = AppDataSource.getRepository(Vendor);
      const vendor = await vendorRepository.findOneBy({ id: Number(id) });

      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found." });
      }

      return res.json(buildVendorResponse(vendor));
    }

    return res.status(400).json({ message: "Invalid role supplied." });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch profile.",
      error,
    });
  }
};
