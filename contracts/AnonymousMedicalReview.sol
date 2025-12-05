// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract AnonymousMedicalReview is SepoliaConfig {

    address public platform;
    uint256 public doctorCount;
    uint256 public reviewCount;

    struct Doctor {
        string name;
        string specialty;
        string clinic;
        bool isRegistered;
        uint256 totalReviews;
        uint256 registrationTime;
    }

    struct Review {
        uint256 doctorId;
        euint8 encryptedRating;
        euint8 encryptedProfessionalism;
        euint8 encryptedCommunication;
        euint8 encryptedWaitTime;
        string encryptedComment;
        bool isSubmitted;
        uint256 timestamp;
        address reviewer;
    }

    struct AggregatedRating {
        uint8 averageRating;
        uint8 averageProfessionalism;
        uint8 averageCommunication;
        uint8 averageWaitTime;
        uint256 totalReviews;
        uint256 lastUpdated;
        bool isRevealed;
    }

    mapping(uint256 => Doctor) public doctors;
    mapping(uint256 => Review) public reviews;
    mapping(uint256 => AggregatedRating) public doctorRatings;
    mapping(address => mapping(uint256 => bool)) public hasReviewed;
    mapping(uint256 => uint256[]) public doctorReviewIds;
    uint256 public currentAggregatingDoctor;

    event DoctorRegistered(uint256 indexed doctorId, string name, string specialty);
    event ReviewSubmitted(uint256 indexed reviewId, uint256 indexed doctorId, address indexed reviewer);
    event RatingRevealed(uint256 indexed doctorId, uint8 averageRating, uint256 totalReviews);
    event AggregationRequested(uint256 indexed doctorId, uint256 reviewCount);

    modifier onlyPlatform() {
        require(msg.sender == platform, "Not authorized");
        _;
    }

    modifier onlyRegisteredDoctor(uint256 doctorId) {
        require(doctorId > 0 && doctorId <= doctorCount, "Invalid doctor ID");
        require(doctors[doctorId].isRegistered, "Doctor not registered");
        _;
    }

    modifier onlyValidRating(uint8 rating) {
        require(rating >= 1 && rating <= 5, "Rating must be between 1-5");
        _;
    }

    constructor() {
        platform = msg.sender;
        doctorCount = 0;
        reviewCount = 0;
    }

    function registerDoctor(
        string memory _name,
        string memory _specialty,
        string memory _clinic
    ) external onlyPlatform returns (uint256) {
        doctorCount++;

        doctors[doctorCount] = Doctor({
            name: _name,
            specialty: _specialty,
            clinic: _clinic,
            isRegistered: true,
            totalReviews: 0,
            registrationTime: block.timestamp
        });

        doctorRatings[doctorCount] = AggregatedRating({
            averageRating: 0,
            averageProfessionalism: 0,
            averageCommunication: 0,
            averageWaitTime: 0,
            totalReviews: 0,
            lastUpdated: block.timestamp,
            isRevealed: false
        });

        emit DoctorRegistered(doctorCount, _name, _specialty);
        return doctorCount;
    }

    function submitAnonymousReview(
        uint256 _doctorId,
        uint8 _rating,
        uint8 _professionalism,
        uint8 _communication,
        uint8 _waitTime,
        string memory _encryptedComment
    ) external
        onlyRegisteredDoctor(_doctorId)
        onlyValidRating(_rating)
        onlyValidRating(_professionalism)
        onlyValidRating(_communication)
        onlyValidRating(_waitTime)
    {
        require(!hasReviewed[msg.sender][_doctorId], "Already reviewed this doctor");
        require(bytes(_encryptedComment).length <= 500, "Comment too long");

        reviewCount++;

        reviews[reviewCount] = Review({
            doctorId: _doctorId,
            encryptedRating: FHE.asEuint8(_rating),
            encryptedProfessionalism: FHE.asEuint8(_professionalism),
            encryptedCommunication: FHE.asEuint8(_communication),
            encryptedWaitTime: FHE.asEuint8(_waitTime),
            encryptedComment: _encryptedComment,
            isSubmitted: true,
            timestamp: block.timestamp,
            reviewer: msg.sender
        });

        doctorReviewIds[_doctorId].push(reviewCount);
        hasReviewed[msg.sender][_doctorId] = true;
        doctors[_doctorId].totalReviews++;

        FHE.allowThis(reviews[reviewCount].encryptedRating);
        FHE.allowThis(reviews[reviewCount].encryptedProfessionalism);
        FHE.allowThis(reviews[reviewCount].encryptedCommunication);
        FHE.allowThis(reviews[reviewCount].encryptedWaitTime);

        FHE.allow(reviews[reviewCount].encryptedRating, msg.sender);
        FHE.allow(reviews[reviewCount].encryptedProfessionalism, msg.sender);
        FHE.allow(reviews[reviewCount].encryptedCommunication, msg.sender);
        FHE.allow(reviews[reviewCount].encryptedWaitTime, msg.sender);

        emit ReviewSubmitted(reviewCount, _doctorId, msg.sender);
    }

    function requestRatingAggregation(uint256 _doctorId) external onlyRegisteredDoctor(_doctorId) {
        require(currentAggregatingDoctor == 0, "Another aggregation in progress");
        require(doctorReviewIds[_doctorId].length >= 3, "Minimum 3 reviews required for aggregation");
        require(!doctorRatings[_doctorId].isRevealed ||
                block.timestamp > doctorRatings[_doctorId].lastUpdated + 7 days,
                "Rating recently revealed");

        uint256 reviewsCount = doctorReviewIds[_doctorId].length;

        bytes32[] memory cts = new bytes32[](reviewsCount * 4);
        uint256 ctIndex = 0;

        for (uint256 i = 0; i < reviewsCount; i++) {
            uint256 reviewId = doctorReviewIds[_doctorId][i];
            Review storage review = reviews[reviewId];

            cts[ctIndex++] = FHE.toBytes32(review.encryptedRating);
            cts[ctIndex++] = FHE.toBytes32(review.encryptedProfessionalism);
            cts[ctIndex++] = FHE.toBytes32(review.encryptedCommunication);
            cts[ctIndex++] = FHE.toBytes32(review.encryptedWaitTime);
        }

        currentAggregatingDoctor = _doctorId;
        FHE.requestDecryption(cts, this.processAggregation.selector);

        emit AggregationRequested(_doctorId, reviewsCount);
    }

    function processAggregation(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) external {
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        uint256 doctorId = currentAggregatingDoctor;
        require(doctorId > 0 && doctorId <= doctorCount, "Invalid doctor ID");

        // Decode the decrypted values
        uint8[] memory decryptedValues = abi.decode(cleartexts, (uint8[]));
        require(decryptedValues.length % 4 == 0, "Invalid decrypted values count");

        uint256 reviewsCount = decryptedValues.length / 4;
        uint256 totalRating = 0;
        uint256 totalProfessionalism = 0;
        uint256 totalCommunication = 0;
        uint256 totalWaitTime = 0;

        for (uint256 i = 0; i < reviewsCount; i++) {
            totalRating += decryptedValues[i * 4];
            totalProfessionalism += decryptedValues[i * 4 + 1];
            totalCommunication += decryptedValues[i * 4 + 2];
            totalWaitTime += decryptedValues[i * 4 + 3];
        }

        doctorRatings[doctorId] = AggregatedRating({
            averageRating: uint8(totalRating / reviewsCount),
            averageProfessionalism: uint8(totalProfessionalism / reviewsCount),
            averageCommunication: uint8(totalCommunication / reviewsCount),
            averageWaitTime: uint8(totalWaitTime / reviewsCount),
            totalReviews: reviewsCount,
            lastUpdated: block.timestamp,
            isRevealed: true
        });

        emit RatingRevealed(doctorId, uint8(totalRating / reviewsCount), reviewsCount);

        currentAggregatingDoctor = 0;
    }

    function getDoctorInfo(uint256 _doctorId) external view returns (
        string memory name,
        string memory specialty,
        string memory clinic,
        uint256 totalReviews,
        uint256 registrationTime
    ) {
        require(_doctorId > 0 && _doctorId <= doctorCount, "Invalid doctor ID");
        Doctor storage doctor = doctors[_doctorId];

        return (
            doctor.name,
            doctor.specialty,
            doctor.clinic,
            doctor.totalReviews,
            doctor.registrationTime
        );
    }

    function getDoctorRating(uint256 _doctorId) external view returns (
        uint8 averageRating,
        uint8 averageProfessionalism,
        uint8 averageCommunication,
        uint8 averageWaitTime,
        uint256 totalReviews,
        uint256 lastUpdated,
        bool isRevealed
    ) {
        require(_doctorId > 0 && _doctorId <= doctorCount, "Invalid doctor ID");
        AggregatedRating storage rating = doctorRatings[_doctorId];

        return (
            rating.averageRating,
            rating.averageProfessionalism,
            rating.averageCommunication,
            rating.averageWaitTime,
            rating.totalReviews,
            rating.lastUpdated,
            rating.isRevealed
        );
    }

    function getReviewStatus(address _reviewer, uint256 _doctorId) external view returns (bool) {
        return hasReviewed[_reviewer][_doctorId];
    }

    function getDoctorReviewCount(uint256 _doctorId) external view returns (uint256) {
        require(_doctorId > 0 && _doctorId <= doctorCount, "Invalid doctor ID");
        return doctorReviewIds[_doctorId].length;
    }

    function getAllDoctorsCount() external view returns (uint256) {
        return doctorCount;
    }

    function getTotalReviewsCount() external view returns (uint256) {
        return reviewCount;
    }

    function canRequestAggregation(uint256 _doctorId) external view returns (bool) {
        if (_doctorId == 0 || _doctorId > doctorCount || !doctors[_doctorId].isRegistered) {
            return false;
        }

        if (currentAggregatingDoctor != 0) {
            return false;
        }

        if (doctorReviewIds[_doctorId].length < 3) {
            return false;
        }

        if (doctorRatings[_doctorId].isRevealed &&
            block.timestamp <= doctorRatings[_doctorId].lastUpdated + 7 days) {
            return false;
        }

        return true;
    }

    function updatePlatformAddress(address _newPlatform) external onlyPlatform {
        require(_newPlatform != address(0), "Invalid address");
        platform = _newPlatform;
    }
}