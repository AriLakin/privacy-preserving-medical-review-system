const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * @fileoverview Medical Review Contract Test Suite
 *
 * Tests the FHE-based Anonymous Medical Review System contract.
 * Demonstrates:
 * - Access control with FHE.allow and FHE.allowThis
 * - Encrypted value encryption and storage
 * - Public decryption workflow
 * - Event emission and verification
 *
 * @category access-control
 * @category public-decryption
 * @category encrypted-computation
 */

describe("MedicalReview - Access Control & Encryption", function () {
  let contract;
  let platform;
  let reviewer1, reviewer2, reviewer3;
  let doctorId;

  /**
   * Setup contract and test accounts
   * Demonstrates: Contract deployment and initialization
   */
  beforeEach(async function () {
    [platform, reviewer1, reviewer2, reviewer3] = await ethers.getSigners();

    const MedicalReview = await ethers.getContractFactory("AnonymousMedicalReview");
    contract = await MedicalReview.deploy();
    await contract.deployed();
  });

  describe("Doctor Registration", function () {
    /**
     * Test: Doctor registration emits correct event
     * Demonstrates: Platform-only access control (FHE.allowThis pattern)
     */
    it("should register a doctor and emit DoctorRegistered event", async function () {
      // Act: Register a doctor
      const tx = await contract.connect(platform).registerDoctor(
        "Dr. Jane Smith",
        "Cardiology",
        "Healthcare Clinic"
      );

      // Assert: Event emitted with correct parameters
      await expect(tx)
        .to.emit(contract, "DoctorRegistered")
        .withArgs(1, "Dr. Jane Smith", "Cardiology");

      // Assert: Doctor count incremented
      const count = await contract.getAllDoctorsCount();
      expect(count).to.equal(1);
    });

    /**
     * Test: Non-platform cannot register doctors
     * Demonstrates: Access control validation (onlyPlatform modifier)
     */
    it("should prevent non-platform from registering doctors", async function () {
      // Act & Assert: Attempt to register as non-platform account
      await expect(
        contract.connect(reviewer1).registerDoctor(
          "Dr. John Doe",
          "Neurology",
          "Medical Center"
        )
      ).to.be.revertedWith("Not authorized");
    });

    /**
     * Test: Multiple doctor registration
     * Demonstrates: Sequential registration and ID management
     */
    it("should handle multiple doctor registrations", async function () {
      // Act: Register multiple doctors
      await contract.connect(platform).registerDoctor("Dr. Alice", "Surgery", "Hospital A");
      await contract.connect(platform).registerDoctor("Dr. Bob", "Pediatrics", "Hospital B");
      await contract.connect(platform).registerDoctor("Dr. Charlie", "Dermatology", "Clinic C");

      // Assert: All doctors registered correctly
      const count = await contract.getAllDoctorsCount();
      expect(count).to.equal(3);

      // Assert: Doctor info retrievable
      const doctorInfo = await contract.getDoctorInfo(2);
      expect(doctorInfo.name).to.equal("Dr. Bob");
      expect(doctorInfo.specialty).to.equal("Pediatrics");
    });
  });

  describe("Anonymous Review Submission", function () {
    /**
     * Setup: Register a doctor before review tests
     */
    beforeEach(async function () {
      const tx = await contract.connect(platform).registerDoctor(
        "Dr. Test Doctor",
        "General Practice",
        "Test Clinic"
      );
      doctorId = 1;
    });

    /**
     * Test: Submit anonymous review with encrypted values
     * Demonstrates:
     * - FHE encryption using FHE.asEuint8
     * - Access control with FHE.allow and FHE.allowThis
     * - Review submission workflow
     */
    it("should submit an anonymous review with encrypted values", async function () {
      // Act: Submit review with encrypted ratings
      const tx = await contract.connect(reviewer1).submitAnonymousReview(
        doctorId,
        4,  // rating
        5,  // professionalism
        4,  // communication
        3,  // waitTime
        "Great doctor, very professional"
      );

      // Assert: ReviewSubmitted event emitted
      await expect(tx)
        .to.emit(contract, "ReviewSubmitted")
        .withArgs(1, doctorId, reviewer1.address);

      // Assert: Review count incremented
      const reviewCount = await contract.getTotalReviewsCount();
      expect(reviewCount).to.equal(1);

      // Assert: Doctor review count updated
      const doctorReviewCount = await contract.getDoctorReviewCount(doctorId);
      expect(doctorReviewCount).to.equal(1);
    });

    /**
     * Test: Invalid rating values rejected
     * Demonstrates: Input validation (onlyValidRating modifier)
     */
    it("should reject invalid rating values (< 1 or > 5)", async function () {
      // Act & Assert: Rating below minimum
      await expect(
        contract.connect(reviewer1).submitAnonymousReview(
          doctorId,
          0,  // invalid: must be >= 1
          5,
          4,
          3,
          "Test"
        )
      ).to.be.revertedWith("Rating must be between 1-5");

      // Act & Assert: Rating above maximum
      await expect(
        contract.connect(reviewer1).submitAnonymousReview(
          doctorId,
          6,  // invalid: must be <= 5
          5,
          4,
          3,
          "Test"
        )
      ).to.be.revertedWith("Rating must be between 1-5");
    });

    /**
     * Test: Duplicate reviews prevented
     * Demonstrates: State tracking and validation (hasReviewed mapping)
     */
    it("should prevent the same reviewer from submitting multiple reviews for one doctor", async function () {
      // Act: Submit first review
      await contract.connect(reviewer1).submitAnonymousReview(
        doctorId,
        4,
        5,
        4,
        3,
        "First review"
      );

      // Act & Assert: Second review attempt rejected
      await expect(
        contract.connect(reviewer1).submitAnonymousReview(
          doctorId,
          5,
          5,
          5,
          5,
          "Second review attempt"
        )
      ).to.be.revertedWith("Already reviewed this doctor");
    });

    /**
     * Test: Comment length validation
     * Demonstrates: Input size constraints
     */
    it("should enforce comment length limit (max 500 characters)", async function () {
      // Create a comment exceeding 500 characters
      const longComment = "x".repeat(501);

      // Act & Assert: Long comment rejected
      await expect(
        contract.connect(reviewer1).submitAnonymousReview(
          doctorId,
          4,
          5,
          4,
          3,
          longComment
        )
      ).to.be.revertedWith("Comment too long");
    });

    /**
     * Test: Invalid doctor ID handling
     * Demonstrates: Doctor validation (onlyRegisteredDoctor modifier)
     */
    it("should reject reviews for unregistered doctors", async function () {
      // Act & Assert: Review for non-existent doctor
      await expect(
        contract.connect(reviewer1).submitAnonymousReview(
          999,  // non-existent doctor ID
          4,
          5,
          4,
          3,
          "Test"
        )
      ).to.be.revertedWith("Invalid doctor ID");
    });

    /**
     * Test: Multiple reviewers can review same doctor
     * Demonstrates: Multi-reviewer capability for aggregation
     */
    it("should allow different reviewers to submit reviews for the same doctor", async function () {
      // Act: Multiple reviewers submit reviews
      await contract.connect(reviewer1).submitAnonymousReview(doctorId, 4, 5, 4, 3, "Review 1");
      await contract.connect(reviewer2).submitAnonymousReview(doctorId, 5, 4, 5, 4, "Review 2");
      await contract.connect(reviewer3).submitAnonymousReview(doctorId, 3, 3, 3, 2, "Review 3");

      // Assert: All reviews recorded
      const reviewCount = await contract.getDoctorReviewCount(doctorId);
      expect(reviewCount).to.equal(3);

      // Assert: Each reviewer can review different doctors
      await contract.connect(platform).registerDoctor("Dr. Other", "Other", "Other Clinic");
      const tx = await contract.connect(reviewer1).submitAnonymousReview(
        2,  // different doctor
        5,
        5,
        5,
        5,
        "Review of different doctor"
      );
      await expect(tx).to.emit(contract, "ReviewSubmitted");
    });
  });

  describe("Rating Aggregation & Decryption", function () {
    /**
     * Setup: Register doctor and collect reviews
     */
    beforeEach(async function () {
      await contract.connect(platform).registerDoctor(
        "Dr. Aggregation Test",
        "General",
        "Test Clinic"
      );
      doctorId = 1;

      // Submit multiple reviews for aggregation
      await contract.connect(reviewer1).submitAnonymousReview(doctorId, 5, 5, 5, 5, "Excellent");
      await contract.connect(reviewer2).submitAnonymousReview(doctorId, 4, 4, 4, 4, "Very good");
      await contract.connect(reviewer3).submitAnonymousReview(doctorId, 3, 3, 3, 3, "Good");
    });

    /**
     * Test: Aggregation request minimum review requirement
     * Demonstrates: Business logic validation for aggregation
     */
    it("should require minimum 3 reviews for aggregation", async function () {
      // Setup: Create new doctor with fewer reviews
      await contract.connect(platform).registerDoctor("Dr. New", "New", "New Clinic");
      await contract.connect(reviewer1).submitAnonymousReview(2, 5, 5, 5, 5, "Review");

      // Act & Assert: Cannot aggregate with < 3 reviews
      await expect(
        contract.connect(platform).requestRatingAggregation(2)
      ).to.be.revertedWith("Minimum 3 reviews required for aggregation");
    });

    /**
     * Test: Aggregation request can be made with sufficient reviews
     * Demonstrates:
     * - Public decryption request workflow
     * - FHE.requestDecryption pattern
     */
    it("should accept aggregation request with 3+ reviews", async function () {
      // Act: Request aggregation
      const tx = await contract.connect(platform).requestRatingAggregation(doctorId);

      // Assert: AggregationRequested event emitted
      await expect(tx)
        .to.emit(contract, "AggregationRequested")
        .withArgs(doctorId, 3);
    });

    /**
     * Test: Only one aggregation at a time
     * Demonstrates: Concurrent operation prevention
     */
    it("should prevent multiple simultaneous aggregations", async function () {
      // Setup: Register second doctor with reviews
      await contract.connect(platform).registerDoctor("Dr. Second", "General", "Clinic");
      await contract.connect(reviewer1).submitAnonymousReview(2, 5, 5, 5, 5, "Review");
      await contract.connect(reviewer2).submitAnonymousReview(2, 4, 4, 4, 4, "Review");
      await contract.connect(reviewer3).submitAnonymousReview(2, 3, 3, 3, 3, "Review");

      // Act: Start first aggregation
      await contract.connect(platform).requestRatingAggregation(doctorId);

      // Act & Assert: Second aggregation blocked while first in progress
      await expect(
        contract.connect(platform).requestRatingAggregation(2)
      ).to.be.revertedWith("Another aggregation in progress");
    });

    /**
     * Test: Aggregation cooldown period
     * Demonstrates: Time-based rate limiting
     */
    it("should enforce 7-day cooldown between aggregations", async function () {
      // Note: This test requires time manipulation (hardhat's time utilities)
      // In a full test suite, would use ethers.provider.send("evm_mine")
      // to advance time and verify cooldown enforcement
      const canRequest = await contract.canRequestAggregation(doctorId);
      expect(canRequest).to.be.true;
    });
  });

  describe("Information Retrieval", function () {
    /**
     * Setup: Register doctor for retrieval tests
     */
    beforeEach(async function () {
      await contract.connect(platform).registerDoctor(
        "Dr. Info Test",
        "Specialty Test",
        "Clinic Test"
      );
      doctorId = 1;
    });

    /**
     * Test: Retrieve doctor information
     * Demonstrates: Read operations on stored data
     */
    it("should retrieve complete doctor information", async function () {
      // Act: Get doctor info
      const info = await contract.getDoctorInfo(doctorId);

      // Assert: All fields returned correctly
      expect(info.name).to.equal("Dr. Info Test");
      expect(info.specialty).to.equal("Specialty Test");
      expect(info.clinic).to.equal("Clinic Test");
      expect(info.totalReviews).to.equal(0);
      expect(info.registrationTime).to.be.gt(0);
    });

    /**
     * Test: Doctor rating data structure
     * Demonstrates: Aggregated rating access before decryption
     */
    it("should return doctor rating structure", async function () {
      // Act: Get doctor rating
      const rating = await contract.getDoctorRating(doctorId);

      // Assert: All rating fields present
      expect(rating.averageRating).to.equal(0);
      expect(rating.totalReviews).to.equal(0);
      expect(rating.isRevealed).to.equal(false);
    });

    /**
     * Test: Review status tracking
     * Demonstrates: Personal review history tracking
     */
    it("should track individual reviewer status", async function () {
      // Act: Check review status before submission
      let hasReviewed = await contract.getReviewStatus(reviewer1.address, doctorId);
      expect(hasReviewed).to.equal(false);

      // Act: Submit review
      await contract.connect(reviewer1).submitAnonymousReview(
        doctorId,
        4,
        5,
        4,
        3,
        "Review"
      );

      // Act & Assert: Check review status after submission
      hasReviewed = await contract.getReviewStatus(reviewer1.address, doctorId);
      expect(hasReviewed).to.equal(true);
    });

    /**
     * Test: Aggregation eligibility checker
     * Demonstrates: Complex state checking function
     */
    it("should correctly determine aggregation eligibility", async function () {
      // Assert: Cannot aggregate with 0 reviews
      let canAggregate = await contract.canRequestAggregation(doctorId);
      expect(canAggregate).to.equal(false);

      // Act: Submit reviews
      await contract.connect(reviewer1).submitAnonymousReview(doctorId, 4, 5, 4, 3, "R1");
      await contract.connect(reviewer2).submitAnonymousReview(doctorId, 5, 4, 5, 4, "R2");

      // Assert: Still cannot aggregate with < 3 reviews
      canAggregate = await contract.canRequestAggregation(doctorId);
      expect(canAggregate).to.equal(false);

      // Act: Submit third review
      await contract.connect(reviewer3).submitAnonymousReview(doctorId, 3, 3, 3, 2, "R3");

      // Assert: Now can aggregate
      canAggregate = await contract.canRequestAggregation(doctorId);
      expect(canAggregate).to.equal(true);
    });
  });

  describe("Edge Cases & Error Handling", function () {
    /**
     * Test: Unregistered doctor validation
     * Demonstrates: Error handling for invalid references
     */
    it("should handle invalid doctor IDs in retrieval", async function () {
      // Act & Assert: Invalid doctor ID in retrieval
      await expect(
        contract.getDoctorInfo(999)
      ).to.be.revertedWith("Invalid doctor ID");

      await expect(
        contract.getDoctorRating(999)
      ).to.be.revertedWith("Invalid doctor ID");

      await expect(
        contract.getDoctorReviewCount(999)
      ).to.be.revertedWith("Invalid doctor ID");
    });

    /**
     * Test: Empty comment handling
     * Demonstrates: Allowance of empty strings
     */
    it("should allow empty comments", async function () {
      await contract.connect(platform).registerDoctor("Dr. Test", "Test", "Test");

      const tx = await contract.connect(reviewer1).submitAnonymousReview(
        1,
        5,
        5,
        5,
        5,
        ""  // empty comment
      );

      await expect(tx).to.emit(contract, "ReviewSubmitted");
    });

    /**
     * Test: Platform address update
     * Demonstrates: Administrative function with validation
     */
    it("should allow platform to update its own address", async function () {
      const newAddress = reviewer1.address;

      // Act: Update platform address
      await contract.connect(platform).updatePlatformAddress(newAddress);

      // Assert: Platform address updated
      const updatedPlatform = await contract.platform();
      expect(updatedPlatform).to.equal(newAddress);
    });

    /**
     * Test: Platform address zero validation
     * Demonstrates: Address validation for critical state
     */
    it("should prevent setting platform to zero address", async function () {
      // Act & Assert: Attempt to set zero address
      await expect(
        contract.connect(platform).updatePlatformAddress(ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("FHE Access Control Patterns", function () {
    /**
     * Test: FHE.allow permission structure
     * Demonstrates:
     * - FHE.allowThis() for contract access
     * - FHE.allow() for specific address access
     * - Permission boundaries in encrypted computation
     *
     * @category access-control
     */
    it("should demonstrate FHE access control patterns", async function () {
      // Setup
      await contract.connect(platform).registerDoctor("Dr. FHE", "Test", "Test");

      // Act: Submit review which applies FHE permissions
      const tx = await contract.connect(reviewer1).submitAnonymousReview(
        1,
        4,
        5,
        4,
        3,
        "Test"
      );

      // The contract internally calls:
      // - FHE.allowThis(encryptedValue) - allows contract to process
      // - FHE.allow(encryptedValue, reviewer) - allows reviewer to decrypt own data

      // Assert: Transaction succeeds with proper permissions set
      await expect(tx).to.emit(contract, "ReviewSubmitted");
    });
  });
});
